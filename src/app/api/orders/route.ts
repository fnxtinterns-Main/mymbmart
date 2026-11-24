import { NextResponse } from 'next/server';
import { ordersStore, syncOrdersFromDisk, syncOrdersFromRedis } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const isProd = process.env.NODE_ENV === 'production';
    const ADMIN_PIN = process.env.ADMIN_PIN;
    const isAdmin = 
      cookieHeader.includes('mbm_admin_authenticated=true') ||
      cookieHeader.includes('mbm_admin_token=') ||
      (Boolean(ADMIN_PIN) && authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === ADMIN_PIN) ||
      (!isProd && authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === 'MBM@Admin2026');

    // Extract customer session if present
    let sessionUserId: string | null = null;
    let sessionPhone: string | null = null;
    const sessionMatch = cookieHeader.match(/mbm_session=([^;]+)/);
    if (sessionMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';
        const decoded: any = jwt.verify(sessionMatch[1], JWT_SECRET);
        if (decoded?.userId) sessionUserId = decoded.userId;
        if (decoded?.phone) sessionPhone = decoded.phone;
      } catch {}
    }

    if (!sessionUserId) {
      const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
      if (userCookieMatch) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookieMatch[1]));
          if (parsed?.id) sessionUserId = parsed.id;
          if (parsed?.phone) sessionPhone = parsed.phone;
        } catch {}
      }
    }

    if (!isAdmin && !sessionUserId && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials or active session required.' }, 
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    let orders: any[] = [];
    let dbSuccess = false;

    try {
      const { prisma } = await import('@/lib/prisma');
      const dbOrders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { deliveryAddress: true },
      });
      orders = dbOrders.map((dbo) => ({
        id: dbo.id,
        orderNumber: dbo.orderNumber,
        userId: dbo.userId,
        deliveryAddress: dbo.deliveryAddress?.fullAddress || 'Ranchi Central',
        pincode: dbo.deliveryAddress?.pincode || '834001',
        fulfilmentType: 'HOME_DELIVERY',
        status: dbo.orderStatus,
        deliveryOtp: dbo.deliveryOtp || '1234',
        paymentMethod: dbo.paymentMethod,
        paymentStatus: dbo.paymentStatus,
        totalMRP: dbo.totalMRP,
        totalPayable: dbo.finalPayable,
        shoppingSavings: (dbo.totalMRP - dbo.totalBachatPrice) || 0,
        creditDeduction: dbo.creditsApplied || 0,
        cashbackEarnable: 0,
        cashbackCredited: false,
        items: [],
        splitShipments: [],
        createdAt: dbo.createdAt instanceof Date ? dbo.createdAt.toISOString() : dbo.createdAt,
        timeline: [
          { step: 'Order Placed', time: 'Just now', completed: true },
        ],
      }));
      dbSuccess = true;
    } catch {}

    if (!dbSuccess) {
      orders = await syncOrdersFromRedis();
    }

    // Customers only see their own orders; admins see all
    if (!isAdmin && sessionUserId) {
      orders = orders.filter(
        (o) => o.userId === sessionUserId || (sessionPhone && o.userPhone === sessionPhone)
      );
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
