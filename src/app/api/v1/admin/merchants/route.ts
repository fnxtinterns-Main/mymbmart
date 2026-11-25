import '@/lib/envConfig';
import { NextResponse } from 'next/server';
import { shopPartnerStore, ApplicationStatus } from '@/lib/shopPartnerStore';
import { sendPartnerApprovalEmail } from '@/lib/emailService';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const hasAdminCookie = cookieHeader.includes('mbm_admin_token=') || cookieHeader.includes('mbm_admin_authenticated=true');
    if (!isAdminAuthorized(req) && !hasAdminCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ApplicationStatus | 'ALL' | null;

    // 1. Sync any cross-process applications from Upstash Redis
    await shopPartnerStore.syncFromRedis().catch(() => {});

    let applications = shopPartnerStore.getApplications(status || 'ALL');
    let accounts = shopPartnerStore.accounts.map(({ passwordHash, ...safe }) => safe);

    // 2. Query PostgreSQL SellerProfile table as authoritative source and merge
    try {
      const { prisma } = await import('@/lib/prisma');
      const dbSellers = await prisma.sellerProfile.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      if (dbSellers && dbSellers.length > 0) {
        const dbApps = dbSellers.map((s) => ({
          id: s.id,
          applicationNumber: `APP-${s.id.slice(0, 8).toUpperCase()}`,
          shopName: s.businessName,
          ownerName: s.user?.name || 'Partner',
          phone: s.user?.phone || '',
          email: s.user?.email || '',
          address: `${s.city}, ${s.state}`,
          city: s.city,
          state: s.state,
          pincode: '834001',
          businessType: (s.isSHG ? 'SHG_COOPERATIVE' : 'KIRANA_GENERAL') as any,
          yearsInBusiness: 1,
          fssaiNumber: s.fssaiNumber || '',
          tradeLicenseNumber: '',
          panNumber: '',
          bankName: '',
          bankAccountNumber: '',
          ifscCode: '',
          documents: {
            tradeLicenseUrl: '',
            fssaiCertUrl: '',
            panCardUrl: '',
            storePhotoUrl: '',
          },
          status: (s.isVerified ? 'APPROVED' : 'PENDING_REVIEW') as ApplicationStatus,
          submittedAt: s.createdAt.toISOString(),
          reviewedAt: s.isVerified ? s.createdAt.toISOString() : undefined,
          reviewedBy: s.isVerified ? 'Admin' : undefined,
          generatedShopId: s.id,
        }));

        // Merge DB applications with Redis/in-memory applications by phone/email/id to avoid duplicates
        const existingPhones = new Set(applications.map((a) => a.phone));
        for (const da of dbApps) {
          if (!existingPhones.has(da.phone)) {
            applications.push(da as any);
            existingPhones.add(da.phone);
          }
        }
      }
    } catch {}

    const filteredApplications = (!status || status === 'ALL')
      ? applications
      : applications.filter((a) => a.status === status);

    const metrics = {
      totalApplications: applications.length,
      pendingReview: applications.filter((a) => a.status === 'PENDING_REVIEW').length,
      approvedPartners: applications.filter((a) => a.status === 'APPROVED').length,
      rejectedApplications: applications.filter((a) => a.status === 'REJECTED').length,
      activeStores: accounts.filter((acc: any) => acc.status === 'ACTIVE').length,
      totalListedProducts: accounts.reduce((acc: number, a: any) => acc + (a.totalProductsListed || 0), 0),
    };

    return NextResponse.json({
      success: true,
      metrics,
      applications: filteredApplications,
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

      // Synchronize updated state to Redis
      await shopPartnerStore.saveToRedis().catch(() => {});

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

      // Synchronize updated state to Redis
      await shopPartnerStore.saveToRedis().catch(() => {});

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
