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
        manager: 'Anand Kumar',
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
    const { orderId, action } = body; // action: 'PACK' | 'DISPATCH'

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'PACK') {
      updateOrderStatus(order.id, 'PACKED');
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} successfully packed and staged for rider pick-up.`,
        order,
      });
    }

    if (action === 'DISPATCH') {
      updateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
      return NextResponse.json({
        success: true,
        message: `Rider Sunil Mahto assigned. Order #${order.orderNumber} is now OUT FOR DELIVERY.`,
        order,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Expected PACK or DISPATCH' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Dispatch error' }, { status: 500 });
  }
}
