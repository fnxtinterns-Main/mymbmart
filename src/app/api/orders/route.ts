import { NextResponse } from 'next/server';
import { ordersStore } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: ordersStore.length,
      orders: ordersStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
