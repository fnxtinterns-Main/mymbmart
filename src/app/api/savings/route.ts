import { NextResponse } from 'next/server';
import { initialWallet, initialTransactions, monthlySavings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    let currentBalance = initialWallet.balance;
    const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
    if (userCookieMatch) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookieMatch[1]));
        if (typeof parsed.walletBalance === 'number') currentBalance = parsed.walletBalance;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balance: currentBalance,
        totalSavings: initialWallet.totalSavings,
        actualCashback: initialWallet.actualCashback,
        walletCredits: initialWallet.walletCredits,
        referralRewards: initialWallet.referralRewards,
        lifetimeEarned: Math.max(currentBalance, initialWallet.lifetimeEarned),
        currency: 'INR',
        currencySymbol: '₹',
      },
      streamsBreakdown: [
        {
          stream: 'Direct Product Discounts',
          amount: initialWallet.totalSavings - (initialWallet.actualCashback + initialWallet.referralRewards),
          description: 'Instant savings deducted directly at checkout on MRP vs Bachat Price',
          color: '#16A34A',
        },
        {
          stream: 'Actual Cashback',
          amount: initialWallet.actualCashback,
          description: 'Cashback credited to spendable wallet upon confirmed order delivery',
          color: '#FF5722',
        },
        {
          stream: 'Referral Rewards',
          amount: initialWallet.referralRewards,
          description: 'Commissions earned from 3-tier downline shopping activity (L1 5%, L2 2%, L3 1%)',
          color: '#0284C7',
        },
        {
          stream: 'Wallet Credits',
          amount: initialWallet.walletCredits,
          description: 'Promotional and community activation credits for everyday shopping',
          color: '#064E3B',
        }
      ],
      monthlyTrend: monthlySavings,
      ledgerEntries: initialTransactions.map((tx) => ({
        ...tx,
        isAuditVerified: true,
        blockchainProof: `https://explorer.mymbmart.com/tx/${tx.smartChainHash}`,
      })),
      complianceNotice: 'MegaBachatMart operates a closed-loop digital reward wallet in compliance with RBI PPI master directions. Wallet rewards can be used towards purchases on mymbmart.com.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch savings data' },
      { status: 500 }
    );
  }
}
