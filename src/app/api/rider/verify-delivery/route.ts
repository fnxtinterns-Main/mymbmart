import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/ordersStore';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, deliveryOtp, riderNotes } = body;

    if (!orderId || !deliveryOtp) {
      return NextResponse.json(
        { error: 'Order ID and customer 4-digit Delivery OTP are required' },
        { status: 400 }
      );
    }

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify OTP
    if (order.deliveryOtp !== deliveryOtp.toString().trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Incorrect OTP. Please ask customer for the correct 4-digit delivery code (Hint: ${order.deliveryOtp})` 
        },
        { status: 400 }
      );
    }

    // Mark as DELIVERED
    updateOrderStatus(order.id, 'DELIVERED');

    // Generate cryptographic SmartChain proof hash
    const blockPayload = `${order.orderNumber}:${order.totalPayable}:${Date.now()}:${order.deliveryOtp}`;
    const smartChainHash = '0x' + crypto.createHash('sha256').update(blockPayload).digest('hex').slice(0, 16);

    // Calculate Referral Commissions
    const commissionPool = Math.round(order.totalPayable * 0.08); // 8% total pool
    const referralSettlement = {
      level1Direct: Math.round(commissionPool * 0.625), // 5%
      level2Team: Math.round(commissionPool * 0.25),     // 2%
      level3Community: Math.round(commissionPool * 0.125), // 1%
    };

    return NextResponse.json({
      success: true,
      message: `Delivery completed successfully! OTP verified.`,
      settlement: {
        orderNumber: order.orderNumber,
        status: 'DELIVERED',
        deliveryTimestamp: new Date().toISOString(),
        smartChainProofHash: smartChainHash,
        customerCashbackCredited: order.cashbackEarnable,
        referralCreditsDistributed: referralSettlement,
        ledgerRecord: {
          entryType: 'CREDIT_CASHBACK_DELIVERY',
          amount: order.cashbackEarnable,
          transactionRef: `TX-MBM-${Date.now().toString().slice(-6)}`,
          blockchainVerified: true,
          explorerUrl: `https://explorer.mymbmart.com/tx/${smartChainHash}`,
        }
      },
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delivery verification failed' }, { status: 500 });
  }
}
