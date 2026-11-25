import { NextResponse } from 'next/server';
import { getOrderByIdAsync } from '@/lib/ordersStore';
import { verifyWebhookSignature } from '@/lib/securityUtils';
import { redisSet } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { financialLedger } from '@/lib/ledgerStore';

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

    const order = await getOrderByIdAsync(orderNumber);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'SUCCESS') {
      order.paymentStatus = 'PAID';
      order.upiTransactionId = transactionRef || `UPI-${Date.now()}`;

      // Synchronize order state in Redis
      await redisSet(`order:${order.id}`, order).catch(() => {});
      await redisSet(`order:${order.orderNumber}`, order).catch(() => {});

      if (process.env.DATABASE_URL) {
        await prisma.$transaction(async (tx) => {
          // 1. Update order payment status
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' },
          });

          // 2. Record Double-Entry Financial Settlement in PostgreSQL
          await financialLedger.recordOrderSettlement({
            orderId: order.id,
            grossAmount: order.totalPayable + (order.creditDeduction || 0),
            walletPaid: order.creditDeduction || 0,
            gatewayPaid: order.totalPayable,
            idempotencyKey: `settle-${order.id}`,
          }, tx);

          // 3. Emit OutboxEvent for payment confirmation
          await tx.outboxEvent.create({
            data: {
              aggregateType: 'PAYMENT',
              aggregateId: order.id,
              eventType: 'PAYMENT_RECEIVED',
              payload: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                amountPaise: Math.round(order.totalPayable * 100),
                transactionRef: order.upiTransactionId,
              },
              idempotencyKey: `outbox-pay-${order.id}`,
              status: 'PENDING',
            },
          });
        });
      }

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
