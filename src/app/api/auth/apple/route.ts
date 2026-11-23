import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, code, user: clientUser, authorization } = body;

    let email = clientUser?.email || '';
    let name = '';
    let sub = clientUser?.id || '';

    // If clientUser provided formatted name
    if (clientUser?.name) {
      if (typeof clientUser.name === 'object') {
        const first = clientUser.name.firstName || '';
        const last = clientUser.name.lastName || '';
        name = `${first} ${last}`.trim();
      } else {
        name = String(clientUser.name);
      }
    }

    // Decode Apple JWT ID Token if present
    const rawToken = idToken || authorization?.id_token;
    if (process.env.NODE_ENV === 'production' && !rawToken) {
      return NextResponse.json(
        { success: false, error: 'Valid Apple ID Token is required for authentication.' },
        { status: 400 }
      );
    }
    if (rawToken && typeof rawToken === 'string') {
      try {
        const decoded: any = jwt.decode(rawToken);
        if (decoded) {
          email = decoded.email || email;
          sub = decoded.sub || sub;
          if (!name && email) {
            name = email.split('@')[0];
          }
        }
      } catch (decodeErr) {
        console.warn('Apple JWT decode notice:', decodeErr);
      }
    }

    if (!email && !name) {
      email = 'apple.user@privaterelay.appleid.com';
      name = 'Apple Member';
    }

    const memberId = 'MBM' + Math.floor(100000 + Math.random() * 900000);
    const referralCode = 'MBM' + Math.floor(100000 + Math.random() * 900000);

    const userProfile = {
      id: sub ? `usr-apple-${sub}` : `usr-${Date.now()}`,
      memberId,
      name: name || 'Apple Member',
      email,
      phone: '',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Apple')}&background=000&color=fff`,
      role: 'CUSTOMER',
      isActive: true,
      level: 'Silver',
      provider: 'APPLE',
      referralCode,
      referredBy: '',
      walletBalance: 100, // ₹100 welcome bonus for verified social login
      joinedAt: new Date().toISOString(),
    };

    const token = jwt.sign(
      {
        userId: userProfile.id,
        memberId: userProfile.memberId,
        role: userProfile.role,
        email: userProfile.email,
        provider: 'APPLE',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Signed in with Apple successfully',
      token,
      user: userProfile,
    });
  } catch (error: any) {
    console.error('Apple Auth Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Apple authentication failed' },
      { status: 500 }
    );
  }
}
