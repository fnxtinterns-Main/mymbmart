import { NextResponse } from 'next/server';
import { routingEngine } from '@/lib/routingEngine';
import { isAdminAuthorized } from '@/lib/securityUtils';

// GET /api/v1/admin/routing/config
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const config = routingEngine.getConfig();
  const history = routingEngine.getConfigHistory();

  return NextResponse.json({
    config,
    history,
  });
}

// PUT /api/v1/admin/routing/config
export async function PUT(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { weights, ...otherSettings } = body;

    const updated = routingEngine.updateConfig(
      {
        weights,
        ...otherSettings,
      },
      'Super Admin'
    );

    return NextResponse.json({
      success: true,
      message: 'Routing configuration updated successfully',
      config: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to update routing configuration',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 400 }
    );
  }
}
