import { NextResponse } from 'next/server';
import { getOrderByIdAsync, updateOrderStatus, ordersStore } from '@/lib/ordersStore';
import { getCatalogProducts } from '@/lib/catalog';
import { redisSet, redisGet, isRedisConfigured } from '@/lib/redis';
import { getJwtSecret } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, reason = 'Customer requested cancellation', otp, phone } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    const order = await getOrderByIdAsync(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Verify caller ownership or admin status
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const JWT_SECRET = getJwtSecret();
    const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.NODE_ENV !== 'production' ? 'MBM@Admin2026' : '');

    let callerUserId: string | null = null;
    let isCallerAdmin = false;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (ADMIN_PIN && token === ADMIN_PIN) isCallerAdmin = true;
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded?.role === 'ADMIN' || decoded?.role === 'SUPER_ADMIN') isCallerAdmin = true;
        if (decoded?.userId) callerUserId = decoded.userId;
      } catch {}
    }

    const adminTokenMatch = cookieHeader.match(/mbm_admin_token=([^;]+)/);
    if (adminTokenMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(adminTokenMatch[1], JWT_SECRET);
        if (decoded?.role === 'ADMIN' || decoded?.role === 'SUPER_ADMIN') isCallerAdmin = true;
      } catch {}
    }

    const sessionMatch = cookieHeader.match(/mbm_session=([^;]+)/);
    if (sessionMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(sessionMatch[1], JWT_SECRET);
        if (decoded?.userId) callerUserId = decoded.userId;
      } catch {}
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const orderPhone = (order.userPhone || (order as any).customerPhone || '').replace(/\D/g, '');
    const isGuestVerified = Boolean(
      (otp && (otp === order.deliveryOtp || otp === order.pickupDetails?.pickupOtp)) ||
      (cleanPhone && orderPhone && cleanPhone.slice(-10) === orderPhone.slice(-10) && otp && otp === order.deliveryOtp)
    );

    const isOwner = Boolean(
      (callerUserId && order.userId === callerUserId) ||
      (callerUserId && orderPhone && callerUserId.replace(/\D/g, '').slice(-10) === orderPhone.slice(-10)) ||
      isGuestVerified
    );

    if (!isCallerAdmin && !isOwner) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: You can only cancel your own orders.'
      }, { status: 403 });
    }

    // Cancellation policy: Only allowed before packing or dispatch
    const nonCancellableStatuses = ['PACKED', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COLLECTED', 'CANCELLED'];
    if (nonCancellableStatuses.includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: `Order cannot be cancelled in status "${order.status}". For assistance, please contact support@mymbmart.com.`
      }, { status: 400 });
    }

    // 1. Update order status
    try {
      updateOrderStatus(order.id, 'CANCELLED', reason);
    } catch {
      order.status = 'CANCELLED';
    }

    order.cancellationReason = reason;
    order.refundStatus = order.paymentStatus === 'PAID' ? 'PROCESSED' : 'NONE';

    // 2. Replenish inventory
    if (order.items && order.items.length > 0) {
      const catalog = getCatalogProducts();
      for (const item of order.items) {
        const prod = catalog.find((p) => p.id === item.productId);
        if (prod) {
          prod.stockQuantity = (prod.stockQuantity || 0) + (item.quantity || 1);
          prod.inStock = true;
        }
      }

      // Restore PostgreSQL StoreInventory if available
      try {
        const { prisma } = await import('@/lib/prisma');
        const storeId = order.darkStore?.id || 'store-ranchi-central';
        for (const item of order.items) {
          await prisma.storeInventory.updateMany({
            where: {
              productId: item.productId,
              storeId: storeId,
            },
            data: {
              quantityAvailable: { increment: item.quantity },
              quantityReserved: { decrement: item.quantity },
            },
          });
        }

        await prisma.order.updateMany({
          where: { OR: [{ id: order.id }, { orderNumber: order.orderNumber }] },
          data: {
            orderStatus: 'CANCELLED',
            paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : 'PENDING',
          },
        });

        // Record double-entry financial ledger refund reversal if order was paid
        if (order.paymentStatus === 'PAID') {
          const { financialLedger } = await import('@/lib/ledgerStore');
          await financialLedger.recordRefundReversal({
            orderId: order.id,
            gatewayRefund: order.totalPayable,
            walletRefund: order.creditDeduction || 0,
            refundId: `ref-cancel-${order.id}`,
          }).catch((err) => console.warn('Ledger refund reversal notice on cancellation:', err));
        }
      } catch (dbErr) {
        // Safe fallback
      }
    }

    // 3. Sync to Upstash Redis
    await redisSet('orders:latest', ordersStore).catch(() => {});
    await redisSet(`order:${order.id}`, order).catch(() => {});
    if (order.orderNumber) {
      await redisSet(`order:${order.orderNumber}`, order).catch(() => {});
    }

    const refundAmount = (order.paymentStatus === 'PAID' ? order.totalPayable : 0) + (order.creditDeduction || 0);

    // 4. Authoritative wallet credit in Upstash Redis and PostgreSQL
    if (refundAmount > 0 && order.userId) {
      if (isRedisConfigured()) {
        try {
          const currentBal = await redisGet<number>(`wallet:${order.userId}`);
          const newBal = (Number(currentBal) || 0) + refundAmount;
          await redisSet(`wallet:${order.userId}`, newBal);
        } catch {}
      }

      try {
        const { prisma } = await import('@/lib/prisma');
        const rewardAcc = await prisma.rewardAccount.findUnique({
          where: { userId: order.userId },
        });
        if (rewardAcc) {
          await prisma.rewardAccount.update({
            where: { userId: order.userId },
            data: {
              balance: { increment: refundAmount },
            },
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: refundAmount > 0 
        ? `Order #${order.orderNumber} cancelled. ₹${refundAmount} has been refunded to your wallet.` 
        : `Order #${order.orderNumber} cancelled successfully.`,
      order,
      refundedToWallet: refundAmount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}
