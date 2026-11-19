import { NextResponse } from 'next/server';
import { initialUser } from '@/lib/data';
import { getDeterministicReferralCode, getDeterministicMemberId } from '@/lib/userSession';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((c) => {
        const [k, ...v] = c.split('=');
        return [k, v.join('=')];
      })
    );

    let activeUser = {
      name: 'Guest Member',
      memberId: 'MBM-GUEST',
      referralCode: '',
      level: 'Silver',
    };

    if (cookies.mbm_user_data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies.mbm_user_data));
        if (parsed) {
          const seed = parsed.email || parsed.phone || parsed.id || parsed.name || '';
          activeUser = {
            name: parsed.name || 'Member',
            memberId: parsed.memberId || getDeterministicMemberId(seed),
            referralCode: parsed.referralCode || getDeterministicReferralCode(seed),
            level: parsed.level || 'Silver',
          };
        }
      } catch {}
    }

    const referralCode = activeUser.referralCode || 'MBM-GUEST';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mymbmart.com';
    const inviteUrl = `${baseUrl}/join?ref=${referralCode}`;

    const tiers = [
      {
        tier: 'Level 1: Direct Referrals',
        percentage: 5,
        description: 'Earn 5% commission on every order placed by friends you directly invite.',
        memberCount: 5,
        totalOrders: 28,
        totalEarnings: 520,
        badge: 'Direct Friends',
      },
      {
        tier: 'Level 2: Team Network',
        percentage: 2,
        description: 'Earn 2% passive commission on orders placed by members invited by your friends.',
        memberCount: 7,
        totalOrders: 19,
        totalEarnings: 210,
        badge: 'Extended Team',
      },
      {
        tier: 'Level 3: Community Downline',
        percentage: 1,
        description: 'Earn 1% continuous override commission on tier-3 community shopping.',
        memberCount: 14,
        totalOrders: 32,
        totalEarnings: 70,
        badge: 'Community Pool',
      },
    ];

    const shareMessage = `Join MegaBachatMart using my VIP invite code ${referralCode} and get ₹100 welcome credit! Shop daily groceries with 10-30 min delivery, authentic SHG handcrafted products, and earn daily cashback on every order: ${inviteUrl}`;

    return NextResponse.json({
      success: true,
      user: {
        name: activeUser.name,
        memberId: activeUser.memberId,
        referralCode,
        inviteUrl,
        rank: activeUser.level,
      },
      stats: {
        directReferralsCount: 5,
        teamCount: 26,
        totalCommissionEarned: 800,
        pendingCommission: 0,
      },
      tiers,
      shareOptions: {
        whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
        shareText: shareMessage,
      },
      rules: [
        'Referral micro-credits are credited once the order return window (48 hours) closes.',
        'Earnings are deposited directly into your immutable MegaBachatMart Reward Account.',
        'No maximum cap on referral earnings — invite more, earn more every month.'
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}
