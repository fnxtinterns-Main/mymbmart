import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentMethod = 'UPI' } = body;

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const amountInRupees = order.totalPayable;
    const amountInPaise = Math.round(amountInRupees * 100);
    const transactionRef = `TXN-${order.orderNumber}-${Date.now().toString().slice(-4)}`;

    // Generate UPI Intent URL & Dynamic QR Payload
    const upiUri = `upi://pay?pa=pay-mymbmart@icici&pn=MegaBachatMart&am=${amountInRupees}&cu=INR&tr=${transactionRef}&tn=Order_${order.orderNumber}`;

    return NextResponse.json({
      success: true,
      transactionRef,
      orderNumber: order.orderNumber,
      amount: amountInRupees,
      currency: 'INR',
      paymentMethod,
      gateway: 'RAZORPAY_UPI_HYBRID',
      upiPayload: {
        vpa: '9801506511@ybl',
        payeeName: 'MegaBachatMart',
        upiUri,
        supportedApps: [
          { name: 'Google Pay', scheme: `gpay://upi/pay?pa=9801506511@ybl&pn=MegaBachatMart&am=${amountInRupees}&tr=${transactionRef}` },
          { name: 'PhonePe', scheme: `phonepe://pay?pa=9801506511@ybl&pn=MegaBachatMart&am=${amountInRupees}&tr=${transactionRef}` },
          { name: 'Paytm', scheme: `paytmmp://pay?pa=9801506511@ybl&pn=MegaBachatMart&am=${amountInRupees}&tr=${transactionRef}` },
        ]
      },
      paymentOptions: [
        { id: 'UPI', label: 'UPI / Dynamic QR Code', description: 'Google Pay, PhonePe, Paytm, BHIM', popular: true },
        { id: 'CARD', label: 'Credit / Debit Card', description: 'Visa, MasterCard, RuPay' },
        { id: 'WALLET', label: 'MegaBachatMart Reward Wallet', description: 'Redeem verified passbook balance' },
        { id: 'COD', label: 'Cash on Delivery (Doorstep)', description: 'Pay cash or scan QR at doorstep' },
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment intent failed' }, { status: 500 });
  }
}
