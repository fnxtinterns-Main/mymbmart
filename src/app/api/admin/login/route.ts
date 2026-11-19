import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_PIN = process.env.ADMIN_PIN || 'MBM@Admin2026';

export async function POST(req: Request) {
  try {
    const { email, passcode } = await req.json();
    const cleanPass = (passcode || '').toString().trim();

    // Verify passcode against server environment variable
    const isMasterPin = cleanPass === ADMIN_PIN;
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
