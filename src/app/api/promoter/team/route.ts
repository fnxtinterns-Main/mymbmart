import { NextResponse } from 'next/server';
import { initialUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const downlineTree = {
      level1Direct: [
        {
          id: 'usr-l1-1',
          name: 'Ramesh Sharma',
          phone: '+91 98231 11223',
          joinedDate: '12 Oct 2026',
          monthlySpend: 4200,
          commissionEarned: 210, // 5%
          status: 'ACTIVE_SHOPPER',
          itemsBoughtCount: 18,
        },
        {
          id: 'usr-l1-2',
          name: 'Priya Kumari',
          phone: '+91 94312 33445',
          joinedDate: '18 Oct 2026',
          monthlySpend: 3600,
          commissionEarned: 180, // 5%
          status: 'ACTIVE_SHOPPER',
          itemsBoughtCount: 14,
        },
        {
          id: 'usr-l1-3',
          name: 'Manoj Verma',
          phone: '+91 97188 55667',
          joinedDate: '26 Oct 2026',
          monthlySpend: 2600,
          commissionEarned: 130, // 5%
          status: 'ACTIVE_SHOPPER',
          itemsBoughtCount: 9,
        }
      ],
      level2Team: [
        {
          id: 'usr-l2-1',
          name: 'Anjali Singh',
          referredBy: 'Priya Kumari',
          joinedDate: '01 Nov 2026',
          monthlySpend: 2800,
          commissionEarned: 56, // 2%
          status: 'ACTIVE_SHOPPER',
        },
        {
          id: 'usr-l2-2',
          name: 'Vikas Dubey',
          referredBy: 'Ramesh Sharma',
          joinedDate: '05 Nov 2026',
          monthlySpend: 3100,
          commissionEarned: 62, // 2%
          status: 'ACTIVE_SHOPPER',
        },
        {
          id: 'usr-l2-3',
          name: 'Sunita Devi',
          referredBy: 'Priya Kumari',
          joinedDate: '09 Nov 2026',
          monthlySpend: 4600,
          commissionEarned: 92, // 2%
          status: 'ACTIVE_SHOPPER',
        }
      ],
      level3Community: [
        {
          id: 'usr-l3-1',
          name: 'Deepak Soren',
          referredBy: 'Vikas Dubey',
          joinedDate: '11 Nov 2026',
          monthlySpend: 3800,
          commissionEarned: 38, // 1%
          status: 'ACTIVE_SHOPPER',
        },
        {
          id: 'usr-l3-2',
          name: 'Kavita Mahato',
          referredBy: 'Sunita Devi',
          joinedDate: '13 Nov 2026',
          monthlySpend: 3200,
          commissionEarned: 32, // 1%
          status: 'ACTIVE_SHOPPER',
        }
      ]
    };

    const totalL1Earnings = downlineTree.level1Direct.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalL2Earnings = downlineTree.level2Team.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalL3Earnings = downlineTree.level3Community.reduce((acc, i) => acc + i.commissionEarned, 0);
    const totalEarnings = totalL1Earnings + totalL2Earnings + totalL3Earnings;

    return NextResponse.json({
      success: true,
      promoter: {
        name: initialUser.name,
        memberId: initialUser.memberId,
        tierLevel: initialUser.level,
        referralCode: initialUser.referralCode,
      },
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
