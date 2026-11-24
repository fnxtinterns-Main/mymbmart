import { NextResponse } from 'next/server';
import { shopPartnerStore, ApplicationStatus } from '@/lib/shopPartnerStore';
import { sendPartnerApprovalEmail } from '@/lib/emailService';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ApplicationStatus | 'ALL' | null;

    const applications = shopPartnerStore.getApplications(status || 'ALL');
    const accounts = shopPartnerStore.accounts.map(({ passwordHash, ...safe }) => safe);

    const metrics = {
      totalApplications: shopPartnerStore.applications.length,
      pendingReview: shopPartnerStore.applications.filter((a) => a.status === 'PENDING_REVIEW').length,
      approvedPartners: shopPartnerStore.applications.filter((a) => a.status === 'APPROVED').length,
      rejectedApplications: shopPartnerStore.applications.filter((a) => a.status === 'REJECTED').length,
      activeStores: shopPartnerStore.accounts.filter((acc) => acc.status === 'ACTIVE').length,
      totalListedProducts: shopPartnerStore.accounts.reduce((acc, a) => acc + a.totalProductsListed, 0),
    };

    return NextResponse.json({
      success: true,
      metrics,
      applications,
      accounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch merchant applications.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, applicationId, customShopId, customPassword, adminNotes, adminName, reason } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'applicationId is required.' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      const result = shopPartnerStore.approveApplication({
        applicationId,
        customShopId,
        customPassword,
        adminNotes,
        adminName,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }

      // Dispatch official approval credentials email via SMTP
      if (result.application?.email && result.account) {
        try {
          await sendPartnerApprovalEmail({
            email: result.application.email,
            ownerName: result.application.ownerName,
            shopName: result.application.shopName,
            shopId: result.account.shopId,
            password: result.application.generatedPassword || customPassword || 'MBM#Partner@2026',
            pincode: result.application.pincode,
          });
        } catch (emailErr) {
          console.warn('[Merchants] Failed to dispatch approval email:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        account: result.account,
        application: result.application,
      });
    }

    if (action === 'REJECT') {
      const result = shopPartnerStore.rejectApplication(applicationId, reason || 'Incomplete KYC documentation');
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json(
      { success: false, message: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process merchant action.' },
      { status: 500 }
    );
  }
}
