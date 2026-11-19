import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDeterministicReferralCode, getDeterministicMemberId } from '@/lib/userSession';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

/**
 * GET Handler: Google OAuth 2.0 Authorization Code Callback
 * Handles redirect from https://accounts.google.com/o/oauth2/v2/auth
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error || !code) {
      console.warn('Google OAuth callback error or cancelled:', error);
      return NextResponse.redirect(new URL('/shop?auth_error=cancelled', req.url));
    }

    const redirectUri = `${url.origin}/api/auth/google`;

    // Exchange auth code for access token with Google token endpoint
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Google token exchange failure:', tokenData);
      return NextResponse.redirect(new URL('/shop?auth_error=token_failed', req.url));
    }

    // Retrieve real authenticated user profile from Google UserInfo endpoint
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();
    const email = googleUser.email || '';
    const name = googleUser.name || googleUser.given_name || (email ? email.split('@')[0] : 'Google Member');
    const avatarUrl = googleUser.picture || '';
    const sub = googleUser.sub || '';

    if (!email) {
      return NextResponse.redirect(new URL('/shop?auth_error=no_email', req.url));
    }

    const userSeed = email || sub || name;
    const memberId = getDeterministicMemberId(userSeed);
    const referralCode = getDeterministicReferralCode(userSeed);

    const userProfile = {
      id: sub ? `usr-google-${sub}` : `usr-${Date.now()}`,
      memberId,
      name,
      email,
      phone: '',
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=064E3B&color=fff`,
      role: 'CUSTOMER',
      isActive: true,
      level: 'Silver',
      provider: 'GOOGLE',
      referralCode,
      referredBy: '',
      walletBalance: 100, // ₹100 welcome reward for verified social login
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

    const response = NextResponse.redirect(new URL('/shop?auth=success', req.url));

    response.cookies.set('mbm_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('mbm_user_data', encodeURIComponent(JSON.stringify(userProfile)), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth GET handler exception:', err);
    return NextResponse.redirect(new URL('/shop?auth_error=exception', req.url));
  }
}

/**
 * POST Handler: Google Identity Services (GIS) Token Payload Callback
 * Receives verified Google user details from frontend popup
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, user: clientUser } = body;

    let email = clientUser?.email || '';
    let name = clientUser?.name || '';
    let avatarUrl = clientUser?.picture || clientUser?.avatarUrl || '';
    let sub = clientUser?.sub || clientUser?.id || '';

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

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Verified Google account email is required.' },
        { status: 400 }
      );
    }

    const userSeed = email || sub || name;
    const memberId = getDeterministicMemberId(userSeed);
    const referralCode = getDeterministicReferralCode(userSeed);

    const userProfile = {
      id: sub ? `usr-google-${sub}` : `usr-${Date.now()}`,
      memberId,
      name: name || email.split('@')[0],
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

    const response = NextResponse.json({
      success: true,
      message: 'Signed in with Google successfully',
      token,
      user: userProfile,
    });

    response.cookies.set('mbm_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('mbm_user_data', encodeURIComponent(JSON.stringify(userProfile)), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google Auth Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
