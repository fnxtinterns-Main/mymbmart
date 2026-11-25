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

    let promoter = {
      name: 'Guest Member',
      memberId: 'MBM-GUEST',
      tierLevel: 'Silver',
      referralCode: '',
    };

    if (cookies.mbm_user_data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies.mbm_user_data));
        if (parsed) {
          const seed = parsed.email || parsed.phone || parsed.id || parsed.name || '';
          promoter = {
            name: parsed.name || 'Member',
            memberId: parsed.memberId || getDeterministicMemberId(seed),
            tierLevel: parsed.level || 'Silver',
            referralCode: parsed.referralCode || getDeterministicReferralCode(seed),
          };
        }
      } catch {}
    }

    const downlineTree: {
      level1Direct: any[];
      level2Team: any[];
      level3Community: any[];
    } = {
      level1Direct: [],
      level2Team: [],
      level3Community: [],
    };

    if (process.env.DATABASE_URL && (promoter.referralCode || promoter.memberId)) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(promoter.referralCode ? [{ referralCode: promoter.referralCode }] : []),
              ...(promoter.memberId ? [{ memberId: promoter.memberId }] : []),
            ]
          },
          include: {
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
          dbUser.downline.forEach((d1) => {
            const d1OrderTotal = d1.orders.reduce((sum, o) => sum + o.finalPayable, 0);
            downlineTree.level1Direct.push({
              memberId: d1.memberId,
              name: d1.name,
              level: d1.level,
              joinedAt: d1.createdAt.toISOString(),
              totalOrders: d1.orders.length,
              commissionEarned: Math.round(d1OrderTotal * 0.05),
            });

            d1.downline.forEach((d2) => {
              const d2OrderTotal = d2.orders.reduce((sum, o) => sum + o.finalPayable, 0);
              downlineTree.level2Team.push({
                memberId: d2.memberId,
                name: d2.name,
                level: d2.level,
                joinedAt: d2.createdAt.toISOString(),
                totalOrders: d2.orders.length,
                commissionEarned: Math.round(d2OrderTotal * 0.02),
              });

              d2.downline.forEach((d3) => {
                const d3OrderTotal = d3.orders.reduce((sum, o) => sum + o.finalPayable, 0);
                downlineTree.level3Community.push({
                  memberId: d3.memberId,
                  name: d3.name,
                  level: d3.level,
                  joinedAt: d3.createdAt.toISOString(),
                  totalOrders: d3.orders.length,
                  commissionEarned: Math.round(d3OrderTotal * 0.01),
                });
              });
            });
          });
        }
      } catch (dbErr) {
        console.warn('Prisma promoter team read notice:', dbErr);
      }
    }

    const totalL1Earnings = downlineTree.level1Direct.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalL2Earnings = downlineTree.level2Team.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalL3Earnings = downlineTree.level3Community.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalEarnings = totalL1Earnings + totalL2Earnings + totalL3Earnings;

    return NextResponse.json({
      success: true,
      promoter,
      summary: {
        totalDirectReferrals: downlineTree.level1Direct.length,
        totalTeamSize: downlineTree.level1Direct.length + downlineTree.level2Team.length + downlineTree.level3Community.length,
        totalCommissionEarned: totalEarnings,
        level1Earnings: totalL1Earnings,
        level2Earnings: totalL2Earnings,
        level3Earnings: totalL3Earnings,
      },
      tree: downlineTree,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch team' }, { status: 500 });
  }
}
