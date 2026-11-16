import { NextRequest, NextResponse } from 'next/server';
import { routingEngine, registeredCandidateShops } from '@/lib/routingEngine';

// GET /api/v1/admin/routing/why-no-shop?pincode=834001&sku_id=MB-GRO-AASH-5K
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode') || '834001';
  const skuId = searchParams.get('sku_id') || 'MB-GRO-AASH-5K';
  const qty = Number(searchParams.get('qty') || 1);
  const fulfilmentType = (searchParams.get('fulfilment_type') || 'DELIVERY') as 'DELIVERY' | 'PICKUP';

  const diagnostics = routingEngine.debugWhyNoShop(
    pincode,
    [{ skuId, quantity: qty }],
    fulfilmentType
  );

  return NextResponse.json({
    ...diagnostics,
    all_registered_shops: registeredCandidateShops.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      status: s.status,
      deliveryRadiusKm: s.deliveryRadiusKm,
      serviceablePincodes: s.serviceablePincodes,
      ordersToday: s.ordersToday,
      capacityPerDay: s.capacityPerDay,
      deliveryCapability: s.deliveryCapability,
    })),
  });
}
