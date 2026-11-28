import '@/lib/envConfig';
import { NextResponse } from 'next/server';
import { shopPartnerStore, ApplicationStatus } from '@/lib/shopPartnerStore';
import { sendPartnerApprovalEmail, sendPartnerRejectionEmail } from '@/lib/emailService';
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

    // 1. Sync any cross-process applications and accounts from Upstash Redis
    await Promise.all([
      shopPartnerStore.syncFromRedis().catch(() => {}),
      shopPartnerStore.syncAccountsFromRedis().catch(() => {}),
    ]);

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

        // Merge DB applications with Redis/in-memory applications by normalized phone/email to avoid duplicates
        const existingPhones = new Set(
          applications.map((a) => String(a.phone || '').replace(/\D/g, '').slice(-10)).filter(Boolean)
        );
        const existingEmails = new Set(
          applications.map((a) => String(a.email || '').trim().toLowerCase()).filter(Boolean)
        );
        for (const da of dbApps) {
          const normPhone = String(da.phone || '').replace(/\D/g, '').slice(-10);
          const normEmail = String(da.email || '').trim().toLowerCase();
          if ((normPhone && existingPhones.has(normPhone)) || (normEmail && existingEmails.has(normEmail))) {
            continue;
          }
          applications.push(da as any);
          if (normPhone) existingPhones.add(normPhone);
          if (normEmail) existingEmails.add(normEmail);
        }
        applications.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
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
    const cookieHeader = req.headers.get('cookie') || '';
    const hasAdminCookie = cookieHeader.includes('mbm_admin_token=') || cookieHeader.includes('mbm_admin_authenticated=true');
    if (!isAdminAuthorized(req) && !hasAdminCookie) {
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

    // Sync cross-process Redis applications & accounts before mutating
    await Promise.all([
      shopPartnerStore.syncFromRedis(true).catch(() => {}),
      shopPartnerStore.syncAccountsFromRedis(true).catch(() => {}),
    ]);

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

      // Persist verified status and credentials in PostgreSQL
      if (process.env.DATABASE_URL && result.application) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const app = result.application;
          const cleanPhone = String(app.phone).replace(/\D/g, '');
          const cleanEmail = (app.email || '').toLowerCase().trim();

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: cleanPhone },
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
              ],
            },
          });

          if (user) {
            await prisma.sellerProfile.updateMany({
              where: { userId: user.id },
              data: { isVerified: true },
            });
          }
        } catch (dbErr) {
          console.warn('[Merchants] DB SellerProfile approval sync notice:', dbErr);
        }
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

      // Synchronize updated state and accounts to Redis
      await Promise.all([
        shopPartnerStore.saveToRedis().catch(() => {}),
        shopPartnerStore.saveAccountsToRedis().catch(() => {}),
      ]);

      return NextResponse.json({
        success: true,
        message: result.message,
        account: result.account,
        application: result.application,
      });
    }

    if (action === 'REJECT') {
      const cleanReason = String(reason || '').trim() || 'Incomplete KYC documentation';
      let result = shopPartnerStore.rejectApplication(applicationId, cleanReason);

      // Fallback: if application exists only in PostgreSQL SellerProfile, sync it into shopPartnerStore as REJECTED
      if (!result.success && process.env.DATABASE_URL) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const dbSeller = await prisma.sellerProfile.findUnique({
            where: { id: applicationId },
            include: { user: true },
          });
          if (dbSeller) {
            await prisma.sellerProfile.update({
              where: { id: dbSeller.id },
              data: { isVerified: false },
            });
            const rejectedApp = {
              id: dbSeller.id,
              applicationNumber: `APP-${dbSeller.id.slice(0, 8).toUpperCase()}`,
              shopName: dbSeller.businessName,
              ownerName: dbSeller.user?.name || 'Partner',
              phone: dbSeller.user?.phone || '',
              email: dbSeller.user?.email || '',
              address: `${dbSeller.city}, ${dbSeller.state}`,
              city: dbSeller.city,
              state: dbSeller.state,
              pincode: '834001',
              businessType: (dbSeller.isSHG ? 'SHG_COOPERATIVE' : 'KIRANA_GENERAL') as any,
              yearsInBusiness: 1,
              fssaiNumber: dbSeller.fssaiNumber || '',
              tradeLicenseNumber: '',
              panNumber: '',
              bankName: '',
              bankAccountNumber: '',
              ifscCode: '',
              documents: { tradeLicenseUrl: '', fssaiCertUrl: '', panCardUrl: '', storePhotoUrl: '' },
              status: 'REJECTED' as ApplicationStatus,
              submittedAt: dbSeller.createdAt.toISOString(),
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin',
              reviewNotes: cleanReason,
            };
            shopPartnerStore.applications.unshift(rejectedApp);
            result = {
              success: true,
              message: `Application ${rejectedApp.applicationNumber} has been rejected.`,
              application: rejectedApp,
            };
          }
        } catch (dbErr) {
          console.warn('[Merchants] DB SellerProfile rejection sync notice:', dbErr);
        }
      }

      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }

      const targetApp =
        result.application ||
        shopPartnerStore.applications.find(
          (a) => a.id === applicationId || a.applicationNumber === applicationId
        );

      let emailSent = false;
      if (targetApp?.email) {
        try {
          emailSent = await sendPartnerRejectionEmail({
            email: targetApp.email,
            ownerName: targetApp.ownerName,
            shopName: targetApp.shopName,
            applicationNumber: targetApp.applicationNumber,
            reason: cleanReason,
          });
        } catch (emailErr) {
          console.warn('[Merchants] Failed to dispatch rejection email:', emailErr);
        }
      }

      // Synchronize updated state and accounts to Redis
      await Promise.all([
        shopPartnerStore.saveToRedis().catch(() => {}),
        shopPartnerStore.saveAccountsToRedis().catch(() => {}),
      ]);

      return NextResponse.json({
        success: true,
        message: result.message,
        emailSent,
        application: targetApp,
      });
    }

    if (action === 'DELETE') {
      const idx = shopPartnerStore.applications.findIndex(
        (a) => a.id === applicationId || a.applicationNumber === applicationId
      );
      if (idx >= 0) {
        shopPartnerStore.applications.splice(idx, 1);
      }

      // Overwrite Redis directly (do not use additive merge saveToRedis, which would restore deleted items)
      try {
        const { isRedisConfigured, redisSet } = await import('@/lib/redis');
        if (isRedisConfigured()) {
          await redisSet('mbm:shop_applications', shopPartnerStore.applications);
        }
      } catch {}

      if (process.env.DATABASE_URL) {
        try {
          const { prisma } = await import('@/lib/prisma');
          await prisma.sellerProfile.deleteMany({
            where: {
              id: applicationId,
              isVerified: false,
            },
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Rejected store application deleted.',
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
