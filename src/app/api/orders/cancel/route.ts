import { NextResponse } from 'next/server';
import { getOrderByIdAsync, updateOrderStatus, ordersStore } from '@/lib/ordersStore';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { redisSet, redisGet, isRedisConfigured } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, reason = 'Customer requested cancellation' } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    const order = await getOrderByIdAsync(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
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
      for (const item of order.items) {
        const prod = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
        if (prod) {
          prod.stockQuantity = (prod.stockQuantity || 0) + (item.quantity || 1);
          prod.inStock = true;
        }
      }

      // Restore PostgreSQL StoreInventory if available
      try {
        const { prisma } = await import('@/lib/prisma');
        for (const item of order.items) {
          await prisma.storeInventory.updateMany({
            where: { productId: item.productId },
            data: {
              quantityAvailable: { increment: item.quantity },
              quantityReserved: { decrement: item.quantity },
            },
          });
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CANCELLED',
            paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : 'PENDING',
          },
        });
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

    const refundAmount = order.paymentStatus === 'PAID' ? order.totalPayable : 0;

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
              lifetimeEarned: { increment: refundAmount },
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
