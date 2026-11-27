import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

let isDotenvAttempted = false;

export async function POST(req: Request) {
  try {
    // Attempt to load .env at most once per process if missing from environment
    if (!isDotenvAttempted && (!process.env.ADMIN_PIN || !process.env.ADMIN_EMAIL || !process.env.JWT_SECRET)) {
      isDotenvAttempted = true;
      try {
        const dotenv = await import('dotenv');
        dotenv.config();
        const path = await import('path');
        dotenv.config({ path: path.resolve(process.cwd(), '.env') });
        dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
      } catch {}
    }

    const { email, passcode } = await req.json();
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const cleanPass = (passcode || '').toString().trim();

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const envAdminPin = (process.env.ADMIN_PIN || '').trim();
    const isProd = process.env.NODE_ENV === 'production';
    const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

    // Secure SHA-256 bootstrap hash prevents plaintext password exposure in Git
    // Hash corresponds to authorized administrator passcode
    const BOOTSTRAP_HASH = 'd53137b3b7dc49b417f431ba27f3010c3ff223ff22c155af196cadfbae8a54cc';
    const BOOTSTRAP_EMAIL = 'fnxt.admin@gmail.com';

    let isAuthorized = false;

    if (envAdminPin && envAdminEmail) {
      const matchEmail = cleanEmail === envAdminEmail;
      const matchPass = cleanPass.length === envAdminPin.length && crypto.timingSafeEqual(Buffer.from(cleanPass), Buffer.from(envAdminPin));
      isAuthorized = matchEmail && matchPass;
    } else {
      // Fallback verification if server environment variables failed to load
      const submittedHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
      const matchEmail = cleanEmail === BOOTSTRAP_EMAIL;
      const matchPass = crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(BOOTSTRAP_HASH));
      isAuthorized = matchEmail && matchPass;
    }

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
    const isSecureCookie = process.env.NODE_ENV === 'production' && process.env.E2E_TEST_MODE !== 'true';
    response.cookies.set('mbm_admin_token', adminToken, {
      path: '/',
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      maxAge: 86400,
    });

    // Also set frontend status flag for UI compatibility
    response.cookies.set('mbm_admin_authenticated', 'true', {
      path: '/',
      httpOnly: false,
      secure: isSecureCookie,
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
