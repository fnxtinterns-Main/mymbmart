import { NextResponse } from 'next/server';
import { generateMasterPlatformReportCsv } from '@/lib/reportGenerator';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const ADMIN_PIN = process.env.ADMIN_PIN;

    // Fail closed in production if ADMIN_PIN is unset and no valid session
    if (process.env.NODE_ENV === 'production' && !ADMIN_PIN && !cookieHeader.includes('mbm_admin_authenticated=true') && !cookieHeader.includes('mbm_admin_token=')) {
      return NextResponse.json(
        { error: 'Server authentication misconfigured. ADMIN_PIN environment variable is required.' },
        { status: 500 }
      );
    }

    const isAdmin = 
      cookieHeader.includes('mbm_admin_authenticated=true') ||
      (ADMIN_PIN && authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === ADMIN_PIN) ||
      (process.env.NODE_ENV !== 'production' && authHeader.startsWith('Bearer '));

    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials or active session required.' },
        { status: 401 }
      );
    }

    let partners: any[] = [];

    try {
      const { prisma } = await import('@/lib/prisma');
      const [stores, sellers, orders] = await Promise.all([
        prisma.store.findMany({
          include: {
            subOrders: true,
          },
        }),
        prisma.sellerProfile.findMany({
          include: {
            user: true,
          },
        }),
        prisma.order.findMany({
          include: {
            subOrders: true,
          },
        }),
      ]);

      // If stores exist in DB, map them with real order metrics
      if (stores.length > 0 || sellers.length > 0) {
        for (const s of stores) {
          const storeSubOrders = orders.flatMap((o) => (o.subOrders || []).filter((so) => so.storeId === s.id));
          const totalOrders = storeSubOrders.length;
          const storeGmv = storeSubOrders.reduce((acc, so) => {
            const parent = orders.find((o) => o.id === so.parentOrderId);
            return acc + (parent?.finalPayable || 0);
          }, 0);
          const refunds = orders
            .filter((o) => (o.orderStatus as string) === 'REFUNDED')
            .reduce((acc, o) => acc + (o.finalPayable || 0), 0);

          partners.push({
            shopId: s.storeCode,
            shopName: s.name,
            ownerName: 'Store Manager',
            phone: '',
            pincode: '834001',
            businessType: 'DARK_STORE',
            totalOrders,
            gmv: storeGmv,
            refunds,
            creditLimit: 0,
            creditDrawn: 0,
            status: s.status,
          });
        }

        for (const sp of sellers) {
          partners.push({
            shopId: sp.id,
            shopName: sp.businessName,
            ownerName: sp.user?.name || 'Seller',
            phone: sp.user?.phone || '',
            pincode: '834001',
            businessType: sp.isSHG ? 'SHG_COOPERATIVE' : 'MARKETPLACE_SELLER',
            totalOrders: 0,
            gmv: 0,
            refunds: 0,
            creditLimit: 0,
            creditDrawn: 0,
            status: sp.isVerified ? 'ACTIVE' : 'PENDING_VERIFICATION',
          });
        }
      }
    } catch (dbErr) {
      console.warn('DB query in master report failed, falling back to empty live audit:', dbErr);
    }

    const csvContent = generateMasterPlatformReportCsv(partners);
    const filename = `MBM_Master_Platform_Consolidated_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to generate master platform report.' },
      { status: 500 }
    );
  }
}
