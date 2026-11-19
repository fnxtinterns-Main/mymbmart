import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/ordersStore';
import { verifyWebhookSignature } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-mbm-signature') || req.headers.get('x-razorpay-signature');

    // Cryptographic signature verification against spoofing
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing payment webhook cryptographic signature.' },
        { status: 400 }
      );
    }

    const body = JSON.parse(rawBody);
    const { orderNumber, transactionRef, status = 'SUCCESS' } = body;

    const order = getOrderById(orderNumber);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'SUCCESS') {
      order.paymentStatus = 'PAID';
      order.upiTransactionId = transactionRef || `UPI-${Date.now()}`;
      return NextResponse.json({
        success: true,
        message: `Payment confirmed for order #${order.orderNumber}. Order routed to dark store queue.`,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        transactionRef: order.upiTransactionId,
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
