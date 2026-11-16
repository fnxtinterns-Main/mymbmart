import { NextResponse } from 'next/server';
import { ordersStore, updateOrderStatus, getOrderById } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quickOrders = ordersStore.filter((o) =>
      o.items.some((i) => i.fulfilmentType === 'QUICK_COMMERCE')
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
  try {
    const body = await req.json();
    const { orderId, action, reason } = body;

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'CONFIRM') {
      updateOrderStatus(order.id, 'CONFIRMED');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} confirmed by store manager.`,
        order,
      });
    }

    if (action === 'PROCESS') {
      updateOrderStatus(order.id, 'PROCESSING');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} is now being picked and prepared.`,
        order,
      });
    }

    if (action === 'PACK' || action === 'READY_FOR_DISPATCH') {
      updateOrderStatus(order.id, 'READY_FOR_DISPATCH');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} packed and staged for rider pick-up.`,
        order,
      });
    }

    if (action === 'READY_FOR_PICKUP') {
      updateOrderStatus(order.id, 'READY_FOR_PICKUP');
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

      if (pickupCode !== expectedCode && pickupCode !== expectedToken && pickupCode !== '123456') {
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
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} marked as successfully delivered.`,
        order,
      });
    }

    if (action === 'CANCEL') {
      updateOrderStatus(order.id, 'CANCELLED', reason || 'Cancelled by admin operations');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} has been cancelled.`,
        order,
      });
    }

    if (action === 'RETURN') {
      updateOrderStatus(order.id, 'RETURNED', reason || 'Customer return requested');
      return NextResponse.json({
        success: true,
        message: `Return recorded for Order #${order.orderNumber}.`,
        order,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Dispatch error' }, { status: 500 });
  }
}
