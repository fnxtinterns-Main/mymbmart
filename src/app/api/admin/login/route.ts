import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.NODE_ENV === 'production' ? '' : 'MBM@Admin2026');

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PIN) {
      console.error('[Security Critical] ADMIN_PIN environment variable must be explicitly configured in production.');
      return NextResponse.json(
        { success: false, error: 'Admin access configuration error. Contact server administrator.' },
        { status: 500 }
      );
    }

    const { email, passcode } = await req.json();
    const cleanPass = (passcode || '').toString().trim();

    // Verify passcode against server environment variable
    const isMasterPin = Boolean(ADMIN_PIN && cleanPass === ADMIN_PIN);
    const isTestAllowed = (process.env.NODE_ENV !== 'production' || process.env.E2E_TEST_MODE === 'true') && 
      (cleanPass === 'MBM#Test001@2026' || cleanPass === 'MBM@Admin2026');

    if (!isMasterPin && !isTestAllowed) {
      return NextResponse.json(
        { success: false, error: 'Invalid Security Passcode. Access denied.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: 'Super Admin',
      name: email || 'System Administrator',
    });

    // Set authenticated cookie with 24hr expiration
    response.cookies.set('mbm_admin_authenticated', 'true', {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an error' },
      { status: 500 }
    );
  }
}
