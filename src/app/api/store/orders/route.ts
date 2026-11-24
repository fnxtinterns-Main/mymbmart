import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { updateOrderStatus, getOrderByIdAsync, syncOrdersFromRedis } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

function checkStoreAuth(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') || '';
  const authHeader = req.headers.get('authorization') || '';
  const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.NODE_ENV !== 'production' ? 'MBM@Admin2026' : '');
  const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

  // 1. Bearer PIN or token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (ADMIN_PIN && token === ADMIN_PIN) return true;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN' || decoded.role === 'STORE_MANAGER' || decoded.role === 'SELLER' || decoded.role === 'SHOP_PARTNER')) {
        return true;
      }
    } catch {}
  }

  // 2. Cryptographic Admin or Partner JWT Cookie
  const adminTokenMatch = cookieHeader.match(/mbm_admin_token=([^;]+)/);
  if (adminTokenMatch) {
    try {
      const decoded: any = jwt.verify(adminTokenMatch[1], JWT_SECRET);
      if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN')) return true;
    } catch {}
  }

  const partnerTokenMatch = cookieHeader.match(/mbm_partner_session=([^;]+)/);
  if (partnerTokenMatch) {
    try {
      const decoded: any = jwt.verify(partnerTokenMatch[1], JWT_SECRET);
      if (decoded && (decoded.role === 'STORE_MANAGER' || decoded.role === 'SELLER' || decoded.role === 'ADMIN' || decoded.role === 'SHOP_PARTNER')) {
        return true;
      }
    } catch {}
  }

  // 3. Dev-only mock fallback for local E2E tests
  if (process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_MODE === 'true') {
    return cookieHeader.includes('mbm_admin_authenticated=true');
  }

  return false;
}

async function syncPrismaOrderStatus(orderId: string, orderStatus: string, paymentStatus?: string) {
  if (!process.env.DATABASE_URL) return;
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.order.updateMany({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      data: {
        orderStatus: orderStatus as any,
        ...(paymentStatus ? { paymentStatus: paymentStatus as any } : {}),
      },
    });
  } catch (err) {
    console.warn(`Prisma order ${orderId} status sync warning:`, err);
  }
}

export async function GET(req: Request) {
  if (!checkStoreAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized: Partner or Admin session required.' }, { status: 401 });
  }

  try {
    const allOrders = await syncOrdersFromRedis();
    const quickOrders = allOrders.filter((o) =>
      o.items && o.items.some((i: any) => i.fulfilmentType === 'QUICK_COMMERCE')
    );

    return NextResponse.json({
      success: true,
      store: {
        id: 'store-ranchi-central',
        name: 'MegaBachatMart Ranchi Central Dark Store',
        manager: 'Store Operations Desk',
        activeRidersAvailable: 4,
      },
      pendingPackCount: quickOrders.filter((o) => o.status === 'PLACED').length,
      dispatchedCount: quickOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      deliveredCount: quickOrders.filter((o) => o.status === 'DELIVERED').length,
      orders: quickOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Store error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!checkStoreAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized: Partner or Admin session required.' }, { status: 401 });
  }

  try {
    await syncOrdersFromRedis();
    const body = await req.json();
    const { orderId, action, reason } = body;

    const order = await getOrderByIdAsync(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'CONFIRM') {
      updateOrderStatus(order.id, 'CONFIRMED');
      await syncPrismaOrderStatus(order.id, 'PROCESSING');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} confirmed by store manager.`,
        order,
      });
    }

    if (action === 'PROCESS') {
      updateOrderStatus(order.id, 'PROCESSING');
      await syncPrismaOrderStatus(order.id, 'PROCESSING');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} is now being picked and prepared.`,
        order,
      });
    }

    if (action === 'PACK' || action === 'READY_FOR_DISPATCH') {
      updateOrderStatus(order.id, 'READY_FOR_DISPATCH');
      await syncPrismaOrderStatus(order.id, 'PACKED');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} packed and staged for rider pick-up.`,
        order,
      });
    }

    if (action === 'READY_FOR_PICKUP') {
      updateOrderStatus(order.id, 'READY_FOR_PICKUP');
      await syncPrismaOrderStatus(order.id, 'PACKED');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} is READY FOR PICKUP. Customer notified with QR Code & OTP.`,
        order,
      });
    }

    if (action === 'VERIFY_PICKUP') {
      const { pickupCode, paymentCollected, paymentMethod, staffName } = body;
      const expectedCode = order.pickupDetails?.pickupOtp || order.deliveryOtp;
      const expectedToken = order.pickupDetails?.qrToken;
      const isTestBypass = process.env.NODE_ENV !== 'production' && pickupCode === '123456';

      if (pickupCode !== expectedCode && pickupCode !== expectedToken && !isTestBypass) {
        return NextResponse.json({ error: 'Invalid Pickup QR Token or OTP. Verification failed.' }, { status: 400 });
      }

      if (order.pickupDetails?.paymentMode === 'PAY_AT_STORE' && !paymentCollected && order.paymentStatus !== 'PAID') {
        return NextResponse.json({ 
          error: 'Payment required: Please collect payment and record payment transaction method before handover.' 
        }, { status: 400 });
      }

      if (paymentCollected) {
        order.paymentStatus = 'PAID';
        if (order.pickupDetails) {
          order.pickupDetails.inStorePaymentReceived = true;
          order.pickupDetails.inStorePaymentMethod = paymentMethod || 'In-Store UPI / POS';
        }
      }

      updateOrderStatus(order.id, 'COLLECTED');
      await syncPrismaOrderStatus(order.id, 'DELIVERED', order.paymentStatus);
      if (order.pickupDetails) {
        order.pickupDetails.collectedAt = new Date().toISOString();
        order.pickupDetails.verifiedByStaff = staffName || 'Store Operations Staff';
      }

      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} successfully verified & handed over to customer. Status updated to COLLECTED.`,
        order,
      });
    }

    if (action === 'DISPATCH') {
      const { fleetType, partnerName, riderName, riderPhone, vehicle } = body;
      updateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
      await syncPrismaOrderStatus(order.id, 'OUT_FOR_DELIVERY');
      if (fleetType) {
        order.assignedRider = {
          name: riderName || (fleetType === 'THIRD_PARTY' ? `${partnerName || 'Shadowfax'} Fleet Rider` : 'MBM Fleet Rider'),
          phone: riderPhone || '9876543210',
          vehicle: vehicle || 'Two-Wheeler (EV)',
        };
        if (order.liveTracking) {
          order.liveTracking.fleetType = fleetType === 'THIRD_PARTY' ? 'THIRD_PARTY_PARTNER' : 'IN_HOUSE_RIDER';
          order.liveTracking.partnerName = partnerName || 'MegaBachat Fleet';
          order.liveTracking.gpsEnabled = true;
        }
      }
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} dispatched with live GPS tracking active.`,
        order,
      });
    }

    if (action === 'DELIVER') {
      updateOrderStatus(order.id, 'DELIVERED');
      await syncPrismaOrderStatus(order.id, 'DELIVERED', order.paymentStatus);
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} marked as successfully delivered.`,
        order,
      });
    }

    if (action === 'CANCEL' || action === 'RETURN' || action === 'REFUND') {
      const targetStatus = action === 'REFUND' ? order.status : (action === 'CANCEL' ? 'CANCELLED' : 'RETURNED');
      if (action !== 'REFUND') {
        updateOrderStatus(order.id, targetStatus as any, reason || `${action} by admin operations`);
      }
      
      let refundResult: any = null;
      if (order.paymentStatus === 'PAID' || body.amount !== undefined) {
        const refundAmount = body.amount !== undefined ? Number(body.amount) : order.totalPayable;
        const walletAmount = body.walletRefund !== undefined ? Number(body.walletRefund) : (action === 'REFUND' ? 0 : (order.creditDeduction || 0));
        
        if (process.env.DATABASE_URL) {
          const { financialLedger } = await import('@/lib/ledgerStore');
          const { prisma } = await import('@/lib/prisma');
          
          const refId = body.refundId || `ref-${action.toLowerCase()}-${order.id}-${Date.now()}`;
          try {
            refundResult = await financialLedger.recordRefundReversal({
              orderId: order.id,
              gatewayRefund: refundAmount,
              walletRefund: walletAmount,
              refundId: refId,
            });

            order.refundStatus = 'PROCESSED';

            // Sync PostgreSQL Order status and create outbox event
            await prisma.order.updateMany({
              where: { id: order.id },
              data: { 
                paymentStatus: 'REFUNDED',
                ...(action !== 'REFUND' ? { orderStatus: targetStatus as any } : {})
              }
            }).catch(() => {});

            await prisma.outboxEvent.create({
              data: {
                eventType: 'ORDER_REFUNDED',
                aggregateType: 'ORDER',
                aggregateId: order.id,
                payload: {
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  refundId: refId,
                  gatewayRefund: refundAmount,
                  walletRefund: walletAmount,
                  totalRefund: refundAmount + walletAmount,
                  reason: reason || `${action} processed`
                },
                idempotencyKey: `outbox-ref-${refId}`
              }
            }).catch(() => {});
          } catch (refundErr: any) {
            console.error(`Refund reversal error for ${order.id}:`, refundErr.message);
            return NextResponse.json({
              success: false,
              error: `Refund reversal failed: ${refundErr.message}`,
              order,
            }, { status: 400 });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `${action} processed for Order #${order.orderNumber}.${refundResult ? ' Financial ledger refund posted.' : ''}`,
        order,
        refund: refundResult,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Dispatch error' }, { status: 500 });
  }
}
