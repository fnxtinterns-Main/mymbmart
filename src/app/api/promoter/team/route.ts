import { NextResponse } from 'next/server';
import { initialUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const downlineTree: {
      level1Direct: any[];
      level2Team: any[];
      level3Community: any[];
    } = {
      level1Direct: [],
      level2Team: [],
      level3Community: [],
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
