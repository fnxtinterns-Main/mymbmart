import { NextResponse } from 'next/server';
import { ordersStore, syncOrdersFromDisk } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdmin = 
      cookieHeader.includes('mbm_admin_authenticated=true') || 
      cookieHeader.includes('mbm_session=') ||
      req.headers.get('authorization')?.startsWith('Bearer');

    if (!isAdmin && process.env.NODE_ENV === 'production') {
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

    let orders: any[] = syncOrdersFromDisk();
    try {
      const { prisma } = await import('@/lib/prisma');
      const dbOrders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbOrders && dbOrders.length > 0) {
        orders = dbOrders;
      }
    } catch {}

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
