import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '@/lib/emailService';
import { getDeterministicReferralCode, getDeterministicMemberId } from '@/lib/userSession';
import { redisGet, redisSet, redisDel, redisCommand } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

// Ephemeral in-memory fallback store if Redis is ever unreachable
const localOtpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, action = 'SEND', otp, referralCode } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Mobile number or Email is required' }, { status: 400 });
    }

    const cleanId = String(identifier).trim().toLowerCase();

    // 1. VERIFY ACTION
    if (action === 'VERIFY') {
      const submittedOtp = otp?.toString().trim();
      const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.E2E_TEST_MODE === 'true';
      const isTestOtp = isTestEnv && submittedOtp === '123456';

      // Verify against Redis first, then in-memory fallback
      let isVerified = isTestOtp;
      if (!isVerified) {
        const storedOtp = await redisGet<string>(`otp:${cleanId}`);
        if (storedOtp && String(storedOtp).trim() === submittedOtp) {
          isVerified = true;
          await redisDel(`otp:${cleanId}`).catch(() => {});
        } else {
          const local = localOtpStore.get(cleanId);
          if (local && local.expiresAt > Date.now() && local.otp === submittedOtp) {
            isVerified = true;
            localOtpStore.delete(cleanId);
          }
        }
      }

      if (!isVerified) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please enter the code sent to your mobile or email.' },
          { status: 400 }
        );
      }

      const isEmail = cleanId.includes('@');
      const cleanPhone = isEmail ? '' : cleanId;
      const cleanEmail = isEmail ? cleanId : '';
      const name = isEmail 
        ? cleanId.split('@')[0].charAt(0).toUpperCase() + cleanId.split('@')[0].slice(1) 
        : 'Member ' + cleanId.slice(-4);
      const memberId = getDeterministicMemberId(cleanId);
      const generatedReferralCode = getDeterministicReferralCode(cleanId);

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

      // Persist user to PostgreSQL if database connection is available
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.user.upsert({
          where: cleanPhone ? { phone: cleanPhone } : { email: cleanEmail },
          update: {
            name: userProfile.name,
          },
          create: {
            id: userProfile.id,
            memberId: userProfile.memberId,
            referralCode: userProfile.referralCode,
            name: userProfile.name,
            phone: cleanPhone || `guest-${Date.now()}`,
            email: cleanEmail || null,
            role: 'CUSTOMER',
          },
        });
      } catch (dbErr) {
        // Safe fallback: proceed with session cookie
      }

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
    // Redis Rate Limiting: Max 5 attempts per 10 minutes per identifier
    const rateLimitKey = `rate-limit:otp:${cleanId}`;
    const attempts = await redisCommand('incr', rateLimitKey);
    if (attempts === 1) {
      await redisCommand('expire', rateLimitKey, 600);
    }
    if (attempts && Number(attempts) > 5) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP attempts. Please wait 10 minutes before requesting again.' },
        { status: 429 }
      );
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP in Redis (10 minutes TTL) + In-memory fallback
    await redisSet(`otp:${cleanId}`, generatedOtp, 600).catch(() => {});
    localOtpStore.set(cleanId, { otp: generatedOtp, expiresAt: Date.now() + 600000 });

    if (cleanId.includes('@')) {
      try {
        await sendOtpEmail(cleanId, generatedOtp);
      } catch (mailErr) {
        console.warn('SMTP mail delivery notice:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP dispatched to ${cleanId}`,
      testOtp: process.env.NODE_ENV !== 'production' ? '123456' : undefined,
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process authentication' }, { status: 500 });
  }
}
