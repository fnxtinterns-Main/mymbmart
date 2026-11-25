import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '@/lib/emailService';
import { getDeterministicReferralCode, getDeterministicMemberId } from '@/lib/userSession';
import { redisSet, redisGet, redisDel, redisCommand, isRedisConfigured } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const memoryOtpStore = new Map<string, { code: string; expiresAt: number }>();

// Ephemeral in-memory fallback store if Redis is ever unreachable
const localOtpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const JWT_SECRET = process.env.JWT_SECRET;
    if (isProd && !JWT_SECRET) {
      return NextResponse.json(
        { error: 'Server authentication misconfigured: JWT_SECRET environment variable is required.' },
        { status: 500 }
      );
    }
    const effectiveJwtSecret = JWT_SECRET || 'dev-insecure-jwt-key-2026';

    const body = await req.json();
    const { identifier, action = 'SEND', otp, referralCode } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Mobile number or Email is required' }, { status: 400 });
    }

    const cleanId = String(identifier).trim().toLowerCase();

    // 1. VERIFY ACTION
    if (action === 'VERIFY') {
      const verifyRateLimitKey = `rate-limit:otp-verify:${cleanId}`;
      try {
        const failAttempts = await redisCommand('get', verifyRateLimitKey);
        if (failAttempts && Number(failAttempts) >= 5) {
          return NextResponse.json(
            { success: false, error: 'Too many incorrect attempts. Please wait 10 minutes or request a new code.' },
            { status: 429 }
          );
        }
      } catch {}

      const submittedOtp = otp?.toString().trim();
      // Universal test OTP is strictly forbidden in production
      const isTestOtp = !isProd && submittedOtp === '123456';

      // Verify against memory fallback store first, then Upstash Redis
      let isVerified = isTestOtp;
      if (!isVerified && submittedOtp) {
        const memRecord = localOtpStore.get(cleanId) || memoryOtpStore.get(identifier);
        if (memRecord && memRecord.expiresAt > Date.now()) {
          const expected = 'otp' in memRecord ? memRecord.otp : (memRecord as any).code;
          if (expected === submittedOtp) {
            isVerified = true;
            localOtpStore.delete(cleanId);
            memoryOtpStore.delete(identifier);
          }
        }
        
        if (!isVerified && isRedisConfigured()) {
          try {
            const redisOtp = await redisGet<string>(`otp:${cleanId}`) || await redisGet<string>(`otp:${identifier}`);
            if (redisOtp && String(redisOtp).trim() === submittedOtp) {
              isVerified = true;
              await redisDel(`otp:${cleanId}`).catch(() => {});
              await redisDel(`otp:${identifier}`).catch(() => {});
            }
          } catch {}
        }
      }

      if (!isVerified) {
        try {
          const count = await redisCommand('incr', verifyRateLimitKey);
          if (count === 1) await redisCommand('expire', verifyRateLimitKey, 600);
        } catch {}

        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please enter the code sent to your mobile or email.' },
          { status: 400 }
        );
      }

      // Clear failed verification counter on successful authentication
      await redisDel(verifyRateLimitKey).catch(() => {});

      const isEmail = cleanId.includes('@');
      const cleanPhone = isEmail ? '' : cleanId;
      const cleanEmail = isEmail ? cleanId : '';
      const name = isEmail 
        ? cleanId.split('@')[0].charAt(0).toUpperCase() + cleanId.split('@')[0].slice(1) 
        : 'Member ' + cleanId.slice(-4);
      const memberId = getDeterministicMemberId(cleanId);
      const generatedReferralCode = getDeterministicReferralCode(cleanId);

      let resolvedUserId = 'usr-' + Date.now();
      let resolvedMemberId = memberId;
      let resolvedName = name;
      let resolvedWalletBalance = 0;

      // Persist or retrieve user in PostgreSQL
      try {
        const { prisma } = await import('@/lib/prisma');
        const existingUser = await prisma.user.findFirst({
          where: cleanPhone ? { phone: cleanPhone } : { email: cleanEmail },
          include: { rewardAccount: true },
        });

        if (existingUser) {
          resolvedUserId = existingUser.id;
          resolvedMemberId = existingUser.memberId || resolvedMemberId;
          resolvedName = existingUser.name || resolvedName;
          if (existingUser.rewardAccount) {
            resolvedWalletBalance = existingUser.rewardAccount.balance || 0;
          }
        } else {
          const created = await prisma.user.create({
            data: {
              id: resolvedUserId,
              memberId: resolvedMemberId,
              referralCode: generatedReferralCode,
              name: resolvedName,
              phone: cleanPhone || `guest-${Date.now()}`,
              email: cleanEmail || null,
              role: 'CUSTOMER',
            },
          });
          resolvedUserId = created.id;
        }
      } catch (dbErr) {
        // Safe fallback: proceed with deterministic attributes
      }

      // Check Redis wallet balance if available
      try {
        const { isRedisConfigured, redisGet } = await import('@/lib/redis');
        if (isRedisConfigured()) {
          const redisBal = await redisGet<number>(`wallet:${resolvedUserId}`);
          if (redisBal !== null && !isNaN(Number(redisBal))) {
            resolvedWalletBalance = Math.max(resolvedWalletBalance, Number(redisBal));
          }
        }
      } catch {}

      const userProfile = {
        id: resolvedUserId,
        memberId: resolvedMemberId,
        name: resolvedName,
        phone: cleanPhone,
        email: cleanEmail,
        role: 'CUSTOMER',
        isActive: true,
        level: 'Silver',
        referralCode: generatedReferralCode,
        referredBy: referralCode || '',
        walletBalance: resolvedWalletBalance,
        joinedAt: new Date().toISOString(),
      };

      const token = jwt.sign(
        { 
          userId: userProfile.id, 
          memberId: userProfile.memberId, 
          role: userProfile.role,
          phone: userProfile.phone 
        },
        effectiveJwtSecret,
        { expiresIn: '30d', algorithm: 'HS256' }
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
    const hasSmsConfig = Boolean(process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN);
    if (!cleanId.includes('@') && !hasSmsConfig && process.env.NODE_ENV === 'production' && process.env.E2E_TEST_MODE !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMS service is currently unavailable. Please sign in using your registered Email address to receive your verification code.' 
        },
        { status: 503 }
      );
    }

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

    // Cryptographically secure PRNG for OTP generation
    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    memoryOtpStore.set(identifier, { code: generatedOtp, expiresAt: Date.now() + 600 * 1000 });
    if (isRedisConfigured()) {
      redisSet(`otp:${identifier}`, generatedOtp, 600).catch(() => {});
    }

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
      message: `OTP dispatched to ${identifier}`,
      ...(!isProd ? { testOtp: '123456' } : {}),
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process authentication' }, { status: 500 });
  }
}
