import { NextResponse } from 'next/server';
import { ordersStore } from '@/lib/ordersStore';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalOrdersCount = ordersStore.length;
    const totalGMV = ordersStore.reduce((acc, o) => acc + o.totalPayable, 0);
    const totalCustomerSavings = ordersStore.reduce((acc, o) => acc + o.shoppingSavings, 0);
    const deliveredOrders = ordersStore.filter((o) => o.status === 'DELIVERED').length;
    const pendingOrders = ordersStore.filter((o) => o.status === 'PLACED' || o.status === 'PACKED').length;
    const inTransitOrders = ordersStore.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;

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
      recentOrders: ordersStore.slice(0, 10),
      systemHealth: {
        database: 'HEALTHY',
        redisQueue: 'OPERATIONAL',
        smartChainNode: 'SYNCED',
        smsSmtpGateway: 'ONLINE',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Metrics error' }, { status: 500 });
  }
}
