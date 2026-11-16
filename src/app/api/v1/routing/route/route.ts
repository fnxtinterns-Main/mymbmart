import { NextRequest, NextResponse } from 'next/server';
import { routingEngine, RoutingOrderContext } from '@/lib/routingEngine';

// POST /api/v1/routing/route
// Internal service / Checkout order route assignment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      customer_id = 'cust-anon',
      fulfilment_type = 'DELIVERY',
      pincode,
      delivery_lat,
      delivery_lng,
      items = [],
      customer_selected_shop_id = null,
      pickup_preferred_shop_id = null,
    } = body;

    if (!order_id || !pincode || !items.length) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order ID, pincode, and cart items are required for routing',
            details: [],
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    const orderCtx: RoutingOrderContext = {
      orderId: order_id,
      customerId: customer_id,
      fulfilmentType: fulfilment_type,
      deliveryPincode: pincode,
      deliveryLat: delivery_lat,
      deliveryLng: delivery_lng,
      customerSelectedShopId: customer_selected_shop_id,
      pickupPreferredShopId: pickup_preferred_shop_id,
      items: items.map((it: any) => ({
        skuId: it.sku_id || it.id,
        skuCode: it.sku_code || it.skuCode,
        quantity: Number(it.quantity || 1),
        sellerId: it.seller_id || null,
      })),
      attemptNumber: 1,
    };

    const result = await routingEngine.routeOrder(orderCtx);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: result.error || 'NO_SHOP_AVAILABLE',
            message: 'Routing failed: No candidate shop could fulfil order requirements',
            routing_audit_id: result.routingAuditId,
            excluded_shops: result.excludedShops.map((e) => ({
              shop_id: e.shopId,
              shop_name: e.shopName,
              filter: e.filterCode,
              reason: e.reason,
            })),
            timestamp: new Date().toISOString(),
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        shop_id: result.selectedShopId,
        shop_name: result.selectedShopName,
        reservation_ids: result.reservationIds,
        estimated_delivery_minutes: result.estimatedDeliveryMinutes,
        winning_score: result.winningScore,
        routing_audit_id: result.routingAuditId,
        latency_ms: result.latencyMs,
        meta: {
          evaluated_candidates: result.candidateCount,
          scored_candidates: result.scoredCount,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Routing engine execution failed',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
