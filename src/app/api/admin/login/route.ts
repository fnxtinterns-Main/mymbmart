import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'fnxt.admin@gmail.com').toLowerCase().trim();
const ADMIN_PIN = process.env.ADMIN_PIN || 'MMBM@Admin2026';

export async function POST(req: Request) {
  try {
    const { email, passcode } = await req.json();
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const cleanPass = (passcode || '').toString().trim();

    // Strictly require authorized admin email and security passcode
    const isAuthorized = cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PIN;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Invalid Administrator Email or Security Passcode. Access denied.' },
        { status: 401 }
      );
    }

    const { default: jwt } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';
    const adminToken = jwt.sign(
      { role: 'ADMIN', email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      role: 'Super Admin',
      name: 'FNXT Super Admin',
      token: adminToken,
    });

    // Set signed cryptographic admin token in HTTP-only cookie
    response.cookies.set('mbm_admin_token', adminToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
    });

    // Also set frontend status flag for UI compatibility
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
