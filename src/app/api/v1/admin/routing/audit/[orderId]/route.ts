import { NextRequest, NextResponse } from 'next/server';
import { routingAuditLogs } from '@/lib/routingEngine';

// GET /api/v1/admin/routing/audit/:orderId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const matches = routingAuditLogs.filter((log) => log.orderId === orderId);

  return NextResponse.json({
    order_id: orderId,
    attempts: matches,
    count: matches.length,
  });
}
