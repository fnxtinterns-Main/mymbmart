import { NextRequest, NextResponse } from 'next/server';
import { routingEngine, RoutingOrderContext } from '@/lib/routingEngine';

// POST /api/v1/routing/check-availability
// Public or customer auth
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fulfilment_type = 'DELIVERY', pincode, items = [], customer_selected_shop_id } = body;

    if (!pincode) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Delivery or pickup pincode is required',
            details: [{ field: 'pincode', message: 'Missing pincode' }],
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cart items cannot be empty',
            details: [{ field: 'items', message: 'Cart items missing' }],
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    const orderCtx: RoutingOrderContext = {
      orderId: `pre-checkout-${Date.now()}`,
      customerId: 'guest-or-session',
      fulfilmentType: fulfilment_type,
      deliveryPincode: pincode,
      customerSelectedShopId: customer_selected_shop_id,
      items: items.map((it: any) => ({
        skuId: it.sku_id || it.id,
        skuCode: it.sku_code || it.skuCode,
        quantity: Number(it.quantity || 1),
        sellerId: it.seller_id || null,
      })),
    };

    const { eligibleShops, exclusions } = routingEngine.applyHardFilters(orderCtx);

    if (eligibleShops.length === 0) {
      return NextResponse.json(
        {
          serviceable: false,
          reason: 'NO_SHOP_AVAILABLE',
          details: `No local store can fulfil all items in pincode ${pincode}`,
          excluded_shops: exclusions.map((e) => ({
            shop_id: e.shopId,
            shop_name: e.shopName,
            filter: e.filterCode,
            reason: e.reason,
          })),
        },
        { status: 200 }
      );
    }

    const scored = routingEngine.scoreCandidates(eligibleShops);

    return NextResponse.json(
      {
        serviceable: true,
        available_shops: scored.map((s) => ({
          shop_id: s.shopId,
          shop_name: s.shopName,
          distance_km: s.distanceKm,
          estimated_delivery_minutes: s.estimatedDeliveryMinutes,
          total_price: s.totalPrice.toFixed(2),
          composite_score: s.score,
          all_items_available: true,
          ranking_factors: s.factors,
          bonus_applied: s.bonusApplied,
        })),
        meta: {
          evaluated_candidates: eligibleShops.length + exclusions.length,
          eligible_candidates: eligibleShops.length,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Routing engine availability check failed',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
