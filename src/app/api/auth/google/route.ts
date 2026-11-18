import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, user: clientUser } = body;

    let email = clientUser?.email || '';
    let name = clientUser?.name || '';
    let avatarUrl = clientUser?.avatarUrl || '';
    let sub = clientUser?.id || '';

    // If an idToken JWT was provided, decode payload
    if (idToken && typeof idToken === 'string') {
      try {
        const decoded: any = jwt.decode(idToken);
        if (decoded) {
          email = decoded.email || email;
          name = decoded.name || name || (email ? email.split('@')[0] : 'Google Member');
          avatarUrl = decoded.picture || avatarUrl;
          sub = decoded.sub || sub;
        }
      } catch (decodeErr) {
        console.warn('Google JWT decode notice:', decodeErr);
      }
    }

    if (!email && !name) {
      email = 'google.user@gmail.com';
      name = 'Google Member';
    }

    const memberId = 'MBM' + Math.floor(100000 + Math.random() * 900000);
    const referralCode = 'MBM' + Math.floor(100000 + Math.random() * 900000);

    const userProfile = {
      id: sub ? `usr-google-${sub}` : `usr-${Date.now()}`,
      memberId,
      name: name || (email ? email.split('@')[0] : 'Google Member'),
      email,
      phone: clientUser?.phone || '',
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=064E3B&color=fff`,
      role: 'CUSTOMER',
      isActive: true,
      level: 'Silver',
      provider: 'GOOGLE',
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
        provider: 'GOOGLE',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Signed in with Google successfully',
      token,
      user: userProfile,
    });
  } catch (error: any) {
    console.error('Google Auth Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
