import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Ensure environment variables are loaded dynamically if not yet attached to process.env
    if (!process.env.ADMIN_PIN || !process.env.ADMIN_EMAIL || !process.env.JWT_SECRET) {
      try {
        const dotenv = await import('dotenv');
        dotenv.config();
        const path = await import('path');
        dotenv.config({ path: path.resolve(process.cwd(), '.env') });
        dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
      } catch {}
    }

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const ADMIN_PIN = (process.env.ADMIN_PIN || '').trim();
    const isProd = process.env.NODE_ENV === 'production';
    const JWT_SECRET = process.env.JWT_SECRET || (!isProd ? 'dev-insecure-jwt-key-2026' : '');

    if (isProd && (!ADMIN_EMAIL || !ADMIN_PIN || !JWT_SECRET)) {
      return NextResponse.json(
        { success: false, error: 'Server security misconfigured: ADMIN_EMAIL, ADMIN_PIN, and JWT_SECRET environment variables must be configured on the server.' },
        { status: 500 }
      );
    }

    const { email, passcode } = await req.json();
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const cleanPass = (passcode || '').toString().trim();

    // Constant-time cryptographic verification against timing attacks
    const isAuthorized = Boolean(
      ADMIN_EMAIL &&
      ADMIN_PIN &&
      cleanEmail === ADMIN_EMAIL &&
      cleanPass.length === ADMIN_PIN.length &&
      crypto.timingSafeEqual(Buffer.from(cleanPass), Buffer.from(ADMIN_PIN))
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Invalid Administrator Email or Security Passcode. Access denied.' },
        { status: 401 }
      );
    }

    const { default: jwt } = await import('jsonwebtoken');
    const adminToken = jwt.sign(
      { role: 'ADMIN', email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    const response = NextResponse.json({
      success: true,
      role: 'Super Admin',
      name: 'Super Admin',
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
