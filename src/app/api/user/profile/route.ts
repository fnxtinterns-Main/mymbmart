import { NextResponse } from 'next/server';
import { initialUser, initialWallet } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    let resolvedUser = { ...initialUser };
    let walletBalance = initialWallet.balance;

    const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
    if (userCookieMatch) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookieMatch[1]));
        if (parsed.name) resolvedUser.name = parsed.name;
        if (parsed.phone) resolvedUser.phone = parsed.phone;
        if (parsed.email) resolvedUser.email = parsed.email;
        if (parsed.memberId) resolvedUser.id = parsed.memberId;
        if (typeof parsed.walletBalance === 'number') walletBalance = parsed.walletBalance;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      user: {
        ...resolvedUser,
        savedAddresses: [
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
        ],
        wallet: {
          balance: walletBalance,
          totalSavings: initialWallet.totalSavings,
          cashback: initialWallet.actualCashback,
          credits: initialWallet.walletCredits,
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
