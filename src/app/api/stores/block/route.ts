import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, shopName, userId, userName, reason } = body;

    if (!shopId || !userId) {
      return NextResponse.json(
        { success: false, message: 'shopId and userId are required.' },
        { status: 400 }
      );
    }

    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Please provide a reason for blocking this store.' },
        { status: 400 }
      );
    }

    const record = await prisma.blockedStore.upsert({
      where: {
        shopId_userId: {
          shopId: String(shopId),
          userId: String(userId),
        },
      },
      update: {
        shopName: String(shopName || 'Partner Store'),
        userName: userName ? String(userName) : null,
        reason: cleanReason,
      },
      create: {
        shopId: String(shopId),
        shopName: String(shopName || 'Partner Store'),
        userId: String(userId),
        userName: userName ? String(userName) : null,
        reason: cleanReason,
      },
    });

    return NextResponse.json({
      success: true,
      blocked: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to block store.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { shopId, userId } = body;

    if (!shopId || !userId) {
      return NextResponse.json(
        { success: false, message: 'shopId and userId are required.' },
        { status: 400 }
      );
    }

    await prisma.blockedStore.deleteMany({
      where: {
        shopId: String(shopId),
        userId: String(userId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to unblock store.' },
      { status: 500 }
    );
  }
}
