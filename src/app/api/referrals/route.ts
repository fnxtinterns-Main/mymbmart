import { NextResponse } from 'next/server';
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

    let l1Count = 0;
    let l1Orders = 0;
    let l1Earnings = 0;

    let l2Count = 0;
    let l2Orders = 0;
    let l2Earnings = 0;

    let l3Count = 0;
    let l3Orders = 0;
    let l3Earnings = 0;

    let totalCommissionEarned = 0;

    if (process.env.DATABASE_URL && (activeUser.referralCode || activeUser.memberId)) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(activeUser.referralCode ? [{ referralCode: activeUser.referralCode }] : []),
              ...(activeUser.memberId ? [{ memberId: activeUser.memberId }] : []),
            ]
          },
          include: {
            rewardAccount: {
              include: {
                entries: {
                  where: {
                    entryType: {
                      in: [
                        'CREDIT_DIRECT_REFERRAL_L1',
                        'CREDIT_TEAM_REFERRAL_L2',
                        'CREDIT_COMMUNITY_REFERRAL_L3',
                      ]
                    }
                  }
                }
              }
            },
            downline: {
              include: {
                orders: { where: { orderStatus: 'DELIVERED' } },
                downline: {
                  include: {
                    orders: { where: { orderStatus: 'DELIVERED' } },
                    downline: {
                      include: {
                        orders: { where: { orderStatus: 'DELIVERED' } }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (dbUser) {
          l1Count = dbUser.downline.length;
          dbUser.downline.forEach((d1) => {
            l1Orders += d1.orders.length;
            l2Count += d1.downline.length;
            d1.downline.forEach((d2) => {
              l2Orders += d2.orders.length;
              l3Count += d2.downline.length;
              d2.downline.forEach((d3) => {
                l3Orders += d3.orders.length;
              });
            });
          });

          if (dbUser.rewardAccount?.entries) {
            dbUser.rewardAccount.entries.forEach((e) => {
              if (e.entryType === 'CREDIT_DIRECT_REFERRAL_L1') l1Earnings += e.amount;
              else if (e.entryType === 'CREDIT_TEAM_REFERRAL_L2') l2Earnings += e.amount;
              else if (e.entryType === 'CREDIT_COMMUNITY_REFERRAL_L3') l3Earnings += e.amount;
            });
          }
          totalCommissionEarned = l1Earnings + l2Earnings + l3Earnings || dbUser.rewardAccount?.totalReferralEarned || 0;
        }
      } catch (dbErr) {
        console.warn('Prisma referral stats notice:', dbErr);
      }
    }

    const tiers = [
      {
        tier: 'Level 1: Direct Referrals',
        percentage: 5,
        description: 'Earn 5% commission on every order placed by friends you directly invite.',
        memberCount: l1Count,
        totalOrders: l1Orders,
        totalEarnings: l1Earnings,
        badge: 'Direct Friends',
      },
      {
        tier: 'Level 2: Team Network',
        percentage: 2,
        description: 'Earn 2% passive commission on orders placed by members invited by your friends.',
        memberCount: l2Count,
        totalOrders: l2Orders,
        totalEarnings: l2Earnings,
        badge: 'Extended Team',
      },
      {
        tier: 'Level 3: Community Downline',
        percentage: 1,
        description: 'Earn 1% continuous override commission on tier-3 community shopping.',
        memberCount: l3Count,
        totalOrders: l3Orders,
        totalEarnings: l3Earnings,
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
        directReferralsCount: l1Count,
        teamCount: l1Count + l2Count + l3Count,
        totalCommissionEarned,
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
