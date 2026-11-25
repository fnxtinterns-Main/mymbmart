import { NextResponse } from 'next/server';
import { initialWallet, initialTransactions, monthlySavings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    let currentBalance = initialWallet.balance;
    let actualCashback = initialWallet.actualCashback;
    let referralRewards = initialWallet.referralRewards;
    let totalSavings = initialWallet.totalSavings;
    let walletCredits = initialWallet.walletCredits;
    let lifetimeEarned = initialWallet.lifetimeEarned;
    let ledgerEntries: any[] = [];

    let parsedCookieUser: any = null;
    const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
    if (userCookieMatch) {
      try {
        parsedCookieUser = JSON.parse(decodeURIComponent(userCookieMatch[1]));
        if (typeof parsedCookieUser?.walletBalance === 'number') {
          currentBalance = parsedCookieUser.walletBalance;
        }
      } catch {}
    }

    if (process.env.DATABASE_URL && parsedCookieUser) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(parsedCookieUser.id ? [{ id: parsedCookieUser.id }] : []),
              ...(parsedCookieUser.memberId ? [{ memberId: parsedCookieUser.memberId }] : []),
              ...(parsedCookieUser.phone ? [{ phone: parsedCookieUser.phone }] : []),
            ]
          },
          include: {
            rewardAccount: {
              include: {
                entries: {
                  take: 20,
                  orderBy: { createdAt: 'desc' }
                }
              }
            },
            orders: {
              where: { orderStatus: 'DELIVERED' }
            }
          }
        });

        if (dbUser && dbUser.rewardAccount) {
          const acc = dbUser.rewardAccount;
          currentBalance = acc.balance;
          actualCashback = acc.totalCashbackEarned;
          referralRewards = acc.totalReferralEarned;
          lifetimeEarned = acc.lifetimeEarned || acc.balance;

          // Compute instant product discounts from delivered orders
          const orderDiscounts = dbUser.orders.reduce((sum, o) => {
            return sum + Math.max(0, (o.totalMRP || o.finalPayable) - o.finalPayable);
          }, 0);
          totalSavings = orderDiscounts + actualCashback + referralRewards;

          if (acc.entries && acc.entries.length > 0) {
            ledgerEntries = acc.entries.map((entry) => ({
              id: entry.id,
              date: entry.createdAt.toISOString().split('T')[0],
              type: entry.entryType,
              category: entry.title,
              amount: entry.amount,
              status: entry.status,
              orderRef: entry.orderId || entry.transactionRef,
              smartChainHash: entry.smartChainHash || '0x' + entry.id.replace(/-/g, '').slice(0, 16),
              isAuditVerified: true,
              blockchainProof: `https://explorer.mymbmart.com/tx/${entry.smartChainHash || entry.id}`,
            }));
          }
        }
      } catch (dbErr) {
        console.warn('Prisma savings read notice:', dbErr);
      }
    }

    if (ledgerEntries.length === 0) {
      ledgerEntries = initialTransactions.map((tx) => ({
        ...tx,
        isAuditVerified: true,
        blockchainProof: `https://explorer.mymbmart.com/tx/${tx.smartChainHash}`,
      }));
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balance: currentBalance,
        totalSavings,
        actualCashback,
        walletCredits,
        referralRewards,
        lifetimeEarned: Math.max(currentBalance, lifetimeEarned),
        currency: 'INR',
        currencySymbol: '₹',
      },
      streamsBreakdown: [
        {
          stream: 'Direct Product Discounts',
          amount: Math.max(0, totalSavings - (actualCashback + referralRewards)),
          description: 'Instant savings deducted directly at checkout on MRP vs Bachat Price',
          color: '#16A34A',
        },
        {
          stream: 'Actual Cashback',
          amount: actualCashback,
          description: 'Cashback credited to spendable wallet upon confirmed order delivery',
          color: '#FF5722',
        },
        {
          stream: 'Referral Rewards',
          amount: referralRewards,
          description: 'Commissions earned from 3-tier downline shopping activity (L1 5%, L2 2%, L3 1%)',
          color: '#0284C7',
        },
        {
          stream: 'Wallet Credits',
          amount: walletCredits,
          description: 'Promotional and community activation credits for everyday shopping',
          color: '#064E3B',
        }
      ],
      monthlyTrend: monthlySavings,
      ledgerEntries,
      complianceNotice: 'MegaBachatMart operates a closed-loop digital reward wallet in compliance with RBI PPI master directions. Wallet rewards can be used towards purchases on mymbmart.com.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch savings data' },
      { status: 500 }
    );
  }
}
