import { NextRequest, NextResponse } from 'next/server';
import { routingEngine, RoutingOrderContext } from '@/lib/routingEngine';

// POST /api/v1/routing/re-route
// Fallback re-routing triggered by shop rejection or SLA breach
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      reason = 'SHOP_REJECTED',
      rejected_shop_id,
      pincode = '834001',
      fulfilment_type = 'DELIVERY',
      items = [],
      attempt_number = 1,
      excluded_shops = [],
    } = body;

    if (!order_id || !rejected_shop_id) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order ID and rejected_shop_id are required for re-routing',
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    const orderCtx: RoutingOrderContext = {
      orderId: order_id,
      customerId: 'cust-anon',
      fulfilmentType: fulfilment_type,
      deliveryPincode: pincode,
      items: items.map((it: any) => ({
        skuId: it.sku_id || it.id,
        skuCode: it.sku_code || it.skuCode,
        quantity: Number(it.quantity || 1),
        sellerId: it.seller_id || null,
      })),
      attemptNumber: attempt_number,
      excludedShopIds: [...excluded_shops, rejected_shop_id],
    };

    const result = await routingEngine.rerouteOrder(orderCtx, reason, rejected_shop_id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: result.error || 'NO_SHOP_AVAILABLE',
            message: `Re-routing attempt #${result.attemptNumber} failed: No alternative shop available`,
            routing_audit_id: result.routingAuditId,
            excluded_shops: result.excludedShops,
            timestamp: new Date().toISOString(),
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        re_routed: true,
        attempt_number: result.attemptNumber,
        new_shop_id: result.selectedShopId,
        new_shop_name: result.selectedShopName,
        reservation_ids: result.reservationIds,
        estimated_delivery_minutes: result.estimatedDeliveryMinutes,
        winning_score: result.winningScore,
        routing_audit_id: result.routingAuditId,
        latency_ms: result.latencyMs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Re-routing failure',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
