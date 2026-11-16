import { NextRequest, NextResponse } from 'next/server';
import { routingAuditLogs } from '@/lib/routingEngine';

// GET /api/v1/admin/routing/audit
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');
  const shopId = searchParams.get('shop_id');
  const limit = Math.min(100, Number(searchParams.get('limit') || 25));

  let logs = routingAuditLogs;

  if (pincode) {
    logs = logs.filter((l) => l.pincode === pincode);
  }
  if (shopId) {
    logs = logs.filter(
      (l) => l.selectedShopId === shopId || l.scoredShops.some((s) => s.shopId === shopId)
    );
  }

  return NextResponse.json({
    data: logs.slice(0, limit),
    meta: {
      total: logs.length,
      limit,
    }
  });
}
