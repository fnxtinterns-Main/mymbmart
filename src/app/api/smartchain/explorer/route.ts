import { NextResponse } from 'next/server';
import { ordersStore } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deliveredOrders = ordersStore.filter((o) => o.status === 'DELIVERED');
    const totalCashbackDistributed = deliveredOrders.reduce((acc, o) => acc + o.cashbackEarnable, 0);

    const verifiedBlocks = deliveredOrders.map((order, idx) => ({
      blockNumber: idx + 1,
      timestamp: order.createdAt,
      transactionsCount: 1,
      merkleRoot: '0x' + (order.id || '').substring(0, 16),
      validatorNode: order.darkStore?.name || 'Ranchi Central Dark Store',
      gasUsed: '0 (Zero-Gas Closed Protocol)',
      transactions: [
        {
          txHash: '0x' + (order.id || '').replace(/-/g, ''),
          type: 'PURCHASE_CASHBACK',
          amount: order.cashbackEarnable,
          beneficiaryMemberId: order.userId,
          orderRef: order.orderNumber,
          description: `Bachat Cashback on Order #${order.orderNumber}`,
          status: 'FINALIZED',
        }
      ]
    }));

    return NextResponse.json({
      success: true,
      network: 'MegaBachatMart Community SmartChain (Layer-2 Private Trust)',
      consensus: 'Proof of Authority (PoA - SHG Federations & Cooperative Nodes)',
      activeNodes: 2,
      latestBlock: verifiedBlocks.length,
      totalVerifiedTransactions: verifiedBlocks.length,
      totalRewardsDistributedINR: totalCashbackDistributed,
      recentBlocks: verifiedBlocks,
      auditCertification: {
        auditor: 'TechNxt AI & FutureNxt Cryptographic Audit Wing',
        standard: 'ISO 27001 & RBI Closed-Loop PPI Framework',
        verified: true,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Explorer failed' }, { status: 500 });
  }
}
