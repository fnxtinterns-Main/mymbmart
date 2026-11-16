import { NextResponse } from 'next/server';
import { shopPartnerStore } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Store ID / Phone and password are required.' },
        { status: 400 }
      );
    }

    const account = shopPartnerStore.authenticateShop(identifier, password);
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please verify your Store ID and password.' },
        { status: 401 }
      );
    }

    if (account.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Your merchant account is suspended. Please contact Ranchi Central HQ.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${account.shopName}!`,
      account: {
        shopId: account.shopId,
        shopName: account.shopName,
        ownerName: account.ownerName,
        email: account.email,
        phone: account.phone,
        pincode: account.pincode,
        address: account.address,
        businessType: account.businessType,
        joinedAt: account.joinedAt,
        totalProductsListed: account.totalProductsListed,
        totalStockUnits: account.totalStockUnits,
        totalOrdersFulfilled: account.totalOrdersFulfilled,
        rating: account.rating,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
