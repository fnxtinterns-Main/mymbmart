import '@/lib/envConfig';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '@/lib/emailService';
import { redisSet, redisGet, redisDel, redisCommand, isRedisConfigured } from '@/lib/redis';
import { getJwtSecret } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

const globalForOtp = globalThis as typeof globalThis & {
  __mbmShopEmailOtp?: Map<string, { otp: string; expiresAt: number }>;
};
const localOtpStore =
  globalForOtp.__mbmShopEmailOtp ||
  (globalForOtp.__mbmShopEmailOtp = new Map<string, { otp: string; expiresAt: number }>());

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, action = 'SEND', otp } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (action === 'VERIFY') {
      const verifyRateLimitKey = `rate-limit:shop-email-otp-verify:${cleanEmail}`;
      try {
        const failAttempts = await redisCommand('get', verifyRateLimitKey);
        if (failAttempts && Number(failAttempts) >= 5) {
          return NextResponse.json(
            { success: false, message: 'Too many incorrect OTP attempts. Please wait 10 minutes or request a new OTP.' },
            { status: 429 }
          );
        }
      } catch {}

      const submittedOtp = String(otp || '').trim();
      let isVerified = process.env.E2E_TEST_MODE === 'true' && submittedOtp === '123456';

      if (!isVerified && submittedOtp) {
        const memRecord = localOtpStore.get(cleanEmail);
        if (memRecord && memRecord.expiresAt > Date.now() && memRecord.otp === submittedOtp) {
          isVerified = true;
          localOtpStore.delete(cleanEmail);
        }

        if (!isVerified && isRedisConfigured()) {
          try {
            const redisOtp = await redisGet<string>(`shop-email-otp:${cleanEmail}`);
            if (redisOtp && String(redisOtp).trim() === submittedOtp) {
              isVerified = true;
              await redisDel(`shop-email-otp:${cleanEmail}`).catch(() => {});
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
          { success: false, message: 'Invalid or expired OTP code. Please check your email and try again.' },
          { status: 400 }
        );
      }

      await redisDel(verifyRateLimitKey).catch(() => {});

      const emailVerificationToken = jwt.sign(
        { email: cleanEmail, purpose: 'MERCHANT_EMAIL_VERIFY' },
        getJwtSecret(),
        { expiresIn: '30m', algorithm: 'HS256' }
      );

      return NextResponse.json({
        success: true,
        verified: true,
        emailVerificationToken,
      });
    }

    // SEND OTP
    const rateLimitKey = `rate-limit:shop-email-otp:${cleanEmail}`;
    try {
      const attempts = await redisCommand('incr', rateLimitKey);
      if (attempts === 1) await redisCommand('expire', rateLimitKey, 600);
      if (attempts && Number(attempts) > 5) {
        return NextResponse.json(
          { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
          { status: 429 }
        );
      }
    } catch {}

    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    localOtpStore.set(cleanEmail, { otp: generatedOtp, expiresAt: Date.now() + 900 * 1000 });
    if (isRedisConfigured()) {
      await redisSet(`shop-email-otp:${cleanEmail}`, generatedOtp, 900).catch(() => {});
    }

    const sent = await sendOtpEmail(cleanEmail, generatedOtp);
    if (!sent && process.env.E2E_TEST_MODE !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Unable to send OTP email right now. Please check your email address and try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${cleanEmail}`,
      resendInSeconds: 15,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process email verification.' },
      { status: 500 }
    );
  }
}
