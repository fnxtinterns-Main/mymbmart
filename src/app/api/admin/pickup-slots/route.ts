import { NextResponse } from 'next/server';
import { pickupSlotsConfig, updateSlotConfig, toggleSlotAvailability } from '@/lib/pickupSlotsStore';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: pickupSlotsConfig
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Slot configuration error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, slotId, available, updates } = body;

    if (action === 'TOGGLE_SLOT') {
      const slot = toggleSlotAvailability(slotId, available);
      return NextResponse.json({
        success: true,
        message: `Slot availability updated`,
        slot
      });
    }

    if (action === 'UPDATE_CONFIG') {
      const config = updateSlotConfig(updates || {});
      return NextResponse.json({
        success: true,
        message: 'Store operating hours and slot capacity updated',
        config
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update slots' }, { status: 500 });
  }
}
