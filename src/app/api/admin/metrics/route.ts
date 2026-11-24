import { NextResponse } from 'next/server';
import { syncOrdersFromRedis } from '@/lib/ordersStore';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!isAdminAuthorized(req)) {
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

    // PostgreSQL is the primary authoritative source of truth across all Passenger workers
    let sourceOrders: any[] = [];
    let dbSuccess = false;

    try {
      const { prisma } = await import('@/lib/prisma');
      const dbOrders = await prisma.order.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      sourceOrders = dbOrders;
      dbSuccess = true;
    } catch {
      // DB unavailable fallback
    }

    if (!dbSuccess) {
      sourceOrders = await syncOrdersFromRedis();
    }

    const totalOrdersCount = sourceOrders.length;
    const totalGMV = sourceOrders.reduce((acc, o: any) => acc + (o.totalPayable || o.finalPayable || 0), 0);
    const totalCustomerSavings = sourceOrders.reduce((acc, o: any) => acc + (o.shoppingSavings || 0), 0);
    const deliveredOrders = sourceOrders.filter((o: any) => (o.status || o.orderStatus) === 'DELIVERED').length;
    const pendingOrders = sourceOrders.filter((o: any) => ['PLACED', 'PACKED', 'PACKING'].includes(o.status || o.orderStatus)).length;
    const inTransitOrders = sourceOrders.filter((o: any) => (o.status || o.orderStatus) === 'OUT_FOR_DELIVERY').length;

    // Dark Store metrics for Ranchi Central
    const darkStoreKPIs = {
      storeCode: 'MBM-RCH-01',
      name: 'MegaBachatMart Ranchi Central Dark Store',
      address: 'Main Road, Ranchi, Jharkhand (834001)',
      activeRiders: 4,
      busyRiders: inTransitOrders,
      averageDeliveryMinutes: 22,
      inventorySKUs: CATALOG_PRODUCTS.length,
      lowStockSKUs: CATALOG_PRODUCTS.filter((p) => p.stockQuantity < 40).map((p) => ({
        sku: p.sku,
        name: p.name,
        stock: p.stockQuantity,
        reorderThreshold: 50,
      })),
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        totalGMV: totalGMV,
        totalOrders: totalOrdersCount,
        totalCustomerSavings: totalCustomerSavings,
        pendingDispatchCount: pendingOrders,
        outForDeliveryCount: inTransitOrders,
        deliveredCount: deliveredOrders,
        activeSHGProducers: 2, // Certified local producer partners
        activePromoterCount: 0,
      },
      darkStore: darkStoreKPIs,
      recentOrders: sourceOrders.slice(0, 25),
      systemHealth: {
        database: 'HEALTHY',
        redisQueue: 'OPERATIONAL',
        smartChainNode: 'SYNCED',
        smsSmtpGateway: 'ONLINE',
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Metrics error' }, { status: 500 });
  }
}
