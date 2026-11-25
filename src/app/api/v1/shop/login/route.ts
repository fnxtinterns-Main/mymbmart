import '@/lib/envConfig';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { shopPartnerStore } from '@/lib/shopPartnerStore';
import { getJwtSecret } from '@/lib/securityUtils';
import { redisCommand, redisDel } from '@/lib/redis';

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

    const cleanId = String(identifier).trim().toLowerCase();
    const rateLimitKey = `rate-limit:partner-login:${cleanId}`;

    // Rate Limiting: Max 10 failed attempts per 10 minutes
    try {
      const attempts = await redisCommand('get', rateLimitKey);
      if (attempts && Number(attempts) >= 10) {
        return NextResponse.json(
          { success: false, message: 'Too many failed login attempts. Please wait 10 minutes before retrying.' },
          { status: 429 }
        );
      }
    } catch {
      // Redis unavailable - proceed gracefully
    }

    // Synchronize cross-process accounts and approved applications from Upstash Redis
    await Promise.all([
      shopPartnerStore.syncAccountsFromRedis().catch(() => {}),
      shopPartnerStore.syncFromRedis().catch(() => {}),
    ]);

    const account = shopPartnerStore.authenticateShop(identifier, password);
    if (!account) {
      try {
        const count = await redisCommand('incr', rateLimitKey);
        if (count === 1) {
          await redisCommand('expire', rateLimitKey, 600);
        }
      } catch {}

      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please verify your Store ID and password.' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    try {
      await redisDel(rateLimitKey);
    } catch {}

    if (account.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Your merchant account is suspended. Please contact Ranchi Central HQ.' },
        { status: 403 }
      );
    }

    // Sign session token for partner portal requests
    const token = jwt.sign(
      {
        shopId: account.shopId,
        shopName: account.shopName,
        phone: account.phone,
        role: 'SHOP_PARTNER',
      },
      getJwtSecret(),
      { expiresIn: '30d', algorithm: 'HS256' }
    );

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${account.shopName}!`,
      token,
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

    response.cookies.set('mbm_partner_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
