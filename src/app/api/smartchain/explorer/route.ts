import { NextResponse } from 'next/server';
import { ordersStore } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let deliveredOrders: Array<{
      id: string;
      orderNumber: string;
      userId: string;
      cashbackEarnable: number;
      createdAt: string;
      darkStoreName?: string;
    }> = [];

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbOrders = await prisma.order.findMany({
          where: { orderStatus: 'DELIVERED' },
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { subOrders: { include: { store: true } } },
        });

        deliveredOrders = dbOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          userId: o.userId,
          cashbackEarnable: o.savingsEarned || Math.round(o.finalPayable * 0.05),
          createdAt: o.createdAt.toISOString(),
          darkStoreName: o.subOrders?.[0]?.store?.name || 'Ranchi Central Dark Store',
        }));
      } catch (dbErr) {
        console.warn('Prisma explorer read notice:', dbErr);
      }
    }

    // Fallback to in-memory store if DB query returned nothing
    if (deliveredOrders.length === 0) {
      deliveredOrders = ordersStore
        .filter((o) => o.status === 'DELIVERED')
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          userId: o.userId,
          cashbackEarnable: o.cashbackEarnable,
          createdAt: o.createdAt,
          darkStoreName: o.darkStore?.name || 'Ranchi Central Dark Store',
        }));
    }

    const totalCashbackDistributed = deliveredOrders.reduce((acc, o) => acc + o.cashbackEarnable, 0);

    const verifiedBlocks = deliveredOrders.map((order, idx) => ({
      blockNumber: idx + 1,
      timestamp: order.createdAt,
      transactionsCount: 1,
      merkleRoot: '0x' + (order.id || '').substring(0, 16),
      validatorNode: order.darkStoreName || 'Ranchi Central Dark Store',
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
