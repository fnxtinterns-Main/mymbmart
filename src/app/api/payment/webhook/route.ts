import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, transactionRef, status = 'SUCCESS', paymentSignature } = body;

    const order = getOrderById(orderNumber);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'SUCCESS') {
      order.paymentStatus = 'PAID';
      return NextResponse.json({
        success: true,
        message: `Payment confirmed for order #${order.orderNumber}. Order routed to dark store queue.`,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        transactionRef,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Payment was not successful or cancelled.',
      paymentStatus: 'PENDING',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Webhook failed' }, { status: 500 });
  }
}
