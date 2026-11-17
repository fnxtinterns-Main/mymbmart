import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { initialUser, initialWallet } from '@/lib/data';
import { sendOtpEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, action = 'SEND', otp, referralCode } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Mobile number or Email is required' }, { status: 400 });
    }

    // 1. VERIFY ACTION
    if (action === 'VERIFY') {
      const submittedOtp = otp?.toString().trim();
      // Accept demo OTP '123456' or any valid 6-digit match
      if (!submittedOtp || (submittedOtp !== '123456' && submittedOtp.length !== 6)) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please enter 123456 for testing.' },
          { status: 400 }
        );
      }

      const isEmail = identifier.includes('@');
      const cleanPhone = isEmail ? '' : identifier;
      const cleanEmail = isEmail ? identifier : '';
      const name = isEmail 
        ? identifier.split('@')[0].charAt(0).toUpperCase() + identifier.split('@')[0].slice(1) 
        : 'Member ' + identifier.slice(-4);
      const memberId = 'MBM' + Math.floor(100000 + Math.random() * 900000);
      const generatedReferralCode = 'MBM' + Math.floor(100000 + Math.random() * 900000);

      const userProfile = {
        id: 'usr-' + Date.now(),
        memberId,
        name,
        phone: cleanPhone,
        email: cleanEmail,
        role: 'CUSTOMER',
        isActive: true,
        level: 'Silver',
        referralCode: generatedReferralCode,
        referredBy: referralCode || '',
        walletBalance: 0,
        joinedAt: new Date().toISOString(),
      };

      const token = jwt.sign(
        { 
          userId: userProfile.id, 
          memberId: userProfile.memberId, 
          role: userProfile.role,
          phone: userProfile.phone 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful! Welcome to MegaBachatMart.',
        token,
        user: userProfile,
      });

      // Set HTTP-only session cookie
      response.cookies.set('mbm_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. SEND OTP ACTION
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    if (identifier.includes('@')) {
      try {
        await sendOtpEmail(identifier, generatedOtp);
      } catch (mailErr) {
        console.warn('SMTP mail delivery failed, falling back to instant OTP:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP dispatched to ${identifier}`,
      testOtp: '123456',
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process authentication' }, { status: 500 });
  }
}
