import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const shopName = searchParams.get('shopName');

    if (!shopId && !shopName) {
      return NextResponse.json(
        { success: false, message: 'shopId or shopName is required.' },
        { status: 400 }
      );
    }

    const reviews = await prisma.storeReview.findMany({
      where: {
        OR: [
          ...(shopId ? [{ shopId }] : []),
          ...(shopName ? [{ shopName: { equals: shopName, mode: 'insensitive' as const } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

    return NextResponse.json({
      success: true,
      reviews,
      avgRating,
      reviewCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load store reviews.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon-client';
    const rateLimitKey = `rate-limit:store-review:${ip}`;
    try {
      const { redisCommand } = await import('@/lib/redis');
      const attempts = await redisCommand('incr', rateLimitKey);
      if (attempts === 1) await redisCommand('expire', rateLimitKey, 600);
      if (attempts && Number(attempts) > 10) {
        return NextResponse.json(
          { success: false, message: 'Too many review submissions. Please wait 10 minutes before trying again.' },
          { status: 429 }
        );
      }
    } catch {}

    const body = await req.json();
    const { shopId, shopName, userId, userName, rating, comment } = body;

    if (!shopId || !userId || !rating) {
      return NextResponse.json(
        { success: false, message: 'shopId, userId, and rating (1-5) are required.' },
        { status: 400 }
      );
    }

    const numericRating = Math.min(5, Math.max(1, Math.round(Number(rating))));
    const cleanComment = String(comment || '').trim();
    if (!cleanComment) {
      return NextResponse.json(
        { success: false, message: 'Please write a short review about your experience.' },
        { status: 400 }
      );
    }

    const saved = await prisma.storeReview.upsert({
      where: {
        shopId_userId: {
          shopId: String(shopId),
          userId: String(userId),
        },
      },
      update: {
        shopName: String(shopName || 'Partner Store'),
        userName: String(userName || 'Customer'),
        rating: numericRating,
        comment: cleanComment,
      },
      create: {
        shopId: String(shopId),
        shopName: String(shopName || 'Partner Store'),
        userId: String(userId),
        userName: String(userName || 'Customer'),
        rating: numericRating,
        comment: cleanComment,
      },
    });

    const allForStore = await prisma.storeReview.findMany({
      where: { shopId: String(shopId) },
    });
    const reviewCount = allForStore.length;
    const avgRating =
      reviewCount > 0
        ? Number((allForStore.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

    return NextResponse.json({
      success: true,
      review: saved,
      avgRating,
      reviewCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit review.' },
      { status: 500 }
    );
  }
}
