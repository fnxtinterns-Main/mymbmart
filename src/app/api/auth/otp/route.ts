import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { initialUser, initialWallet } from '@/lib/data';
import { sendOtpEmail } from '@/lib/emailService';
import { getDeterministicReferralCode, getDeterministicMemberId } from '@/lib/userSession';
import { redisSet, redisGet, redisDel, isRedisConfigured } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';
const memoryOtpStore = new Map<string, { code: string; expiresAt: number }>();

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
      const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.E2E_TEST_MODE === 'true';
      const isTestOtp = isTestEnv && submittedOtp === '123456';

      let isOtpValid = isTestOtp;
      if (!isOtpValid && submittedOtp) {
        const memRecord = memoryOtpStore.get(identifier);
        if (memRecord && memRecord.expiresAt > Date.now() && memRecord.code === submittedOtp) {
          isOtpValid = true;
          memoryOtpStore.delete(identifier);
        } else if (isRedisConfigured()) {
          try {
            const redisOtp = await redisGet<string>(`otp:${identifier}`);
            if (redisOtp && String(redisOtp) === submittedOtp) {
              isOtpValid = true;
              await redisDel(`otp:${identifier}`);
            }
          } catch {}
        }
      }

      if (!isOtpValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please enter the code sent to your mobile.' },
          { status: 400 }
        );
      }

      const isEmail = identifier.includes('@');
      const cleanPhone = isEmail ? '' : identifier;
      const cleanEmail = isEmail ? identifier : '';
      const name = isEmail 
        ? identifier.split('@')[0].charAt(0).toUpperCase() + identifier.split('@')[0].slice(1) 
        : 'Member ' + identifier.slice(-4);
      const memberId = getDeterministicMemberId(identifier);
      const generatedReferralCode = getDeterministicReferralCode(identifier);

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

      response.cookies.set('mbm_user_data', encodeURIComponent(JSON.stringify(userProfile)), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. SEND OTP ACTION
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    memoryOtpStore.set(identifier, { code: generatedOtp, expiresAt: Date.now() + 600 * 1000 });
    if (isRedisConfigured()) {
      redisSet(`otp:${identifier}`, generatedOtp, 600).catch(() => {});
    }

    if (identifier.includes('@')) {
      try {
        await sendOtpEmail(identifier, generatedOtp);
      } catch (mailErr) {
        console.warn('SMTP mail delivery failed, falling back to instant OTP:', mailErr);
      }
    }

    const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.E2E_TEST_MODE === 'true';

    return NextResponse.json({
      success: true,
      message: `OTP dispatched to ${identifier}`,
      ...(isTestEnv ? { testOtp: '123456' } : {}),
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process authentication' }, { status: 500 });
  }
}
