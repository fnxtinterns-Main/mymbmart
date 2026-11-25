import { NextResponse } from 'next/server';
import { getOrderByIdAsync } from '@/lib/ordersStore';
import { isAdminAuthorized } from '@/lib/securityUtils';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let order: any = null;

    // Prisma-First: Attempt retrieval from PostgreSQL
    try {
      const { prisma } = await import('@/lib/prisma');
      const dbOrder = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        include: { items: true, deliveryAddress: true },
      });
      if (dbOrder) {
        order = dbOrder;
      }
    } catch {}

    // Resilient fallback to active store + Redis
    if (!order) {
      order = await getOrderByIdAsync(id);
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: `Order with reference ${id} not found.` },
        { status: 404 }
      );
    }

    // Verify caller ownership or staff/admin privileges
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

    let callerUserId: string | null = null;
    let isStaffOrAdmin = isAdminAuthorized(req);

    if (!isStaffOrAdmin) {
      // Check partner session (merchant/fulfillment staff)
      const partnerTokenMatch = cookieHeader.match(/mbm_partner_session=([^;]+)/);
      if (partnerTokenMatch) {
        try {
          const decoded: any = jwt.verify(partnerTokenMatch[1], JWT_SECRET);
          if (['STORE_MANAGER', 'SELLER', 'ADMIN', 'SHOP_PARTNER'].includes(decoded?.role)) {
            isStaffOrAdmin = true;
          }
        } catch {}
      }
    }

    if (!isStaffOrAdmin) {
      // Check customer session
      const sessionMatch = cookieHeader.match(/mbm_session=([^;]+)/);
      let customerToken = sessionMatch ? sessionMatch[1] : null;
      if (!customerToken && authHeader.startsWith('Bearer ')) {
        customerToken = authHeader.slice(7).trim();
      }

      if (customerToken) {
        try {
          const decoded: any = jwt.verify(customerToken, JWT_SECRET);
          if (decoded?.userId) callerUserId = decoded.userId;
          if (decoded?.role === 'ADMIN' || decoded?.role === 'SUPER_ADMIN') isStaffOrAdmin = true;
        } catch {}
      }
    }

    // Dev/E2E test fallback
    if (process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_MODE === 'true') {
      isStaffOrAdmin = true;
    }

    const isOwner = Boolean(callerUserId && (order.userId === callerUserId || order.userPhone === callerUserId));
    if (!isStaffOrAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You do not have permission to view this order.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve order tracking' },
      { status: 500 }
    );
  }
}
