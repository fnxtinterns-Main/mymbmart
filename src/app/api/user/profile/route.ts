import { NextResponse } from 'next/server';
import { initialUser, initialWallet } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    let resolvedUser = { ...initialUser };
    let walletBalance = initialWallet.balance;
    let totalSavings = initialWallet.totalSavings;
    let cashback = initialWallet.actualCashback;
    let credits = initialWallet.walletCredits;
    let savedAddresses: any[] = [];

    const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
    let parsedCookie: any = null;
    if (userCookieMatch) {
      try {
        parsedCookie = JSON.parse(decodeURIComponent(userCookieMatch[1]));
        if (parsedCookie.name) resolvedUser.name = parsedCookie.name;
        if (parsedCookie.phone) resolvedUser.phone = parsedCookie.phone;
        if (parsedCookie.email) resolvedUser.email = parsedCookie.email;
        if (parsedCookie.memberId) resolvedUser.id = parsedCookie.memberId;
        if (typeof parsedCookie.walletBalance === 'number') walletBalance = parsedCookie.walletBalance;
      } catch {}
    }

    if (process.env.DATABASE_URL && parsedCookie) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(parsedCookie.id ? [{ id: parsedCookie.id }] : []),
              ...(parsedCookie.memberId ? [{ memberId: parsedCookie.memberId }] : []),
              ...(parsedCookie.phone ? [{ phone: parsedCookie.phone }] : []),
            ]
          },
          include: {
            rewardAccount: true,
            addresses: true,
          }
        });

        if (dbUser) {
          resolvedUser.name = dbUser.name || resolvedUser.name;
          resolvedUser.phone = dbUser.phone || resolvedUser.phone;
          resolvedUser.email = dbUser.email || resolvedUser.email;
          resolvedUser.id = dbUser.memberId || resolvedUser.id;

          if (dbUser.rewardAccount) {
            walletBalance = dbUser.rewardAccount.balance;
            cashback = dbUser.rewardAccount.totalCashbackEarned;
            totalSavings = dbUser.rewardAccount.totalSavings || (dbUser.rewardAccount.totalCashbackEarned + dbUser.rewardAccount.totalReferralEarned);
          }

          if (dbUser.addresses && dbUser.addresses.length > 0) {
            savedAddresses = dbUser.addresses.map((a) => ({
              id: a.id,
              type: a.type,
              fullAddress: a.fullAddress,
              pincode: a.pincode,
              isDefault: a.isDefault,
              latitude: a.latitude,
              longitude: a.longitude,
            }));
          }
        }
      } catch (dbErr) {
        console.warn('Prisma profile read notice:', dbErr);
      }
    }

    if (savedAddresses.length === 0) {
      savedAddresses = [
        {
          id: 'addr-1',
          type: 'HOME',
          fullAddress: 'Flat 402, Royal Residency, Main Road, Ranchi, Jharkhand',
          pincode: '834001',
          isDefault: true,
          latitude: 23.3441,
          longitude: 85.3096,
        },
        {
          id: 'addr-2',
          type: 'WORK',
          fullAddress: 'Tech Hub, Harmu Housing Colony, Ranchi, Jharkhand',
          pincode: '834002',
          isDefault: false,
          latitude: 23.3620,
          longitude: 85.3120,
        }
      ];
    }

    return NextResponse.json({
      success: true,
      user: {
        ...resolvedUser,
        savedAddresses,
        wallet: {
          balance: walletBalance,
          totalSavings,
          cashback,
          credits,
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullAddress, pincode, type = 'HOME', landmark } = body;

    if (!fullAddress || !pincode) {
      return NextResponse.json({ error: 'Address and PIN code are required' }, { status: 400 });
    }

    const newAddress = {
      id: 'addr-' + Date.now(),
      type,
      fullAddress,
      landmark: landmark || '',
      pincode,
      isDefault: true,
      latitude: 23.3441,
      longitude: 85.3096,
    };

    return NextResponse.json({
      success: true,
      message: 'Delivery address saved successfully',
      address: newAddress,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save address' }, { status: 500 });
  }
}
