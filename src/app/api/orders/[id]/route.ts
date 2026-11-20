import { NextResponse } from 'next/server';
import { getOrderByIdAsync } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let order: any = null;

    // Prisma-First: Attempt retrieval from PostgreSQL
    try {
      const { prisma } = await import('@/lib/prisma');
      const dbOrder = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        include: { items: true, deliveryAddress: true },
      });
      if (dbOrder) {
        order = dbOrder;
      }
    } catch {}

    // Resilient fallback to active store + Redis
    if (!order) {
      order = await getOrderByIdAsync(id);
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: `Order with reference ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve order tracking' },
      { status: 500 }
    );
  }
}
