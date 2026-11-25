import { NextResponse } from 'next/server';
import { shopPartnerStore } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      shopName,
      ownerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      businessType,
      yearsInBusiness,
      fssaiNumber,
      tradeLicenseNumber,
      gstin,
      panNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      documents,
    } = body;

    // Validation for essential fields
    if (!shopName || !ownerName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Shop name, owner name, and contact phone number are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number (e.g. 9845612300).' },
        { status: 400 }
      );
    }

    if (fssaiNumber && !/^\d{14}$/.test(String(fssaiNumber).trim())) {
      return NextResponse.json(
        { success: false, message: 'FSSAI License Number must be a valid 14-digit number.' },
        { status: 400 }
      );
    }

    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(panNumber).trim())) {
      return NextResponse.json(
        { success: false, message: 'PAN Number must be a valid 10-character code (e.g. ABCDE1234F).' },
        { status: 400 }
      );
    }

    const effectivePincode = pincode || '834001';
    const effectiveEmail = email && String(email).trim() !== '' 
      ? String(email).trim() 
      : `${cleanPhone}@partner.mymbmart.com`;
    const effectiveAddress = address && String(address).trim() !== '' 
      ? String(address).trim() 
      : `Main Market Area, Pincode ${effectivePincode}`;
    const effectiveTradeLicense = tradeLicenseNumber || 'PENDING_VERIF';
    const effectiveBankAcc = bankAccountNumber || 'PENDING_ONBOARDING';
    const effectiveIfsc = ifscCode || 'SBIN000000';
    const effectiveFssai = fssaiNumber || 'PENDING_VERIF';

    const application = shopPartnerStore.submitApplication({
      shopName: String(shopName).trim(),
      ownerName: String(ownerName).trim(),
      phone: cleanPhone,
      email: effectiveEmail,
      address: effectiveAddress,
      city: city || 'Ranchi',
      state: state || 'Jharkhand',
      pincode: effectivePincode,
      businessType: businessType || 'KIRANA_GENERAL',
      yearsInBusiness: Number(yearsInBusiness) || 1,
      fssaiNumber: effectiveFssai,
      tradeLicenseNumber: effectiveTradeLicense,
      gstin: gstin || 'UNREGISTERED',
      panNumber: panNumber || 'PENDING',
      bankName: bankName || 'State Bank of India',
      bankAccountNumber: effectiveBankAcc,
      ifscCode: effectiveIfsc,
      documents: documents || {},
    });

    // Authoritative PostgreSQL persistence across all Node worker processes
    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma');
        let user = await prisma.user.findFirst({
          where: { OR: [{ phone: cleanPhone }, { email: effectiveEmail }] },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: String(ownerName).trim(),
              phone: cleanPhone,
              email: effectiveEmail,
              memberId: 'MBM-SEL-' + Math.floor(100000 + Math.random() * 900000),
              referralCode: 'REF-' + Math.floor(10000 + Math.random() * 90000),
              role: 'SELLER',
            },
          });
        }
        await prisma.sellerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            businessName: String(shopName).trim(),
            isSHG: businessType === 'SHG_COOPERATIVE',
            shgGroupName: businessType === 'SHG_COOPERATIVE' ? String(shopName).trim() : null,
            gstin: gstin || null,
            fssaiNumber: effectiveFssai,
            city: city || 'Ranchi',
            state: state || 'Jharkhand',
            isVerified: false,
          },
          update: {
            businessName: String(shopName).trim(),
            gstin: gstin || null,
            fssaiNumber: effectiveFssai,
            city: city || 'Ranchi',
            state: state || 'Jharkhand',
          },
        });
      } catch (dbErr) {
        console.warn('Postgres merchant application persistence notice:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Your application (${application.applicationNumber}) has been submitted successfully to MegaBachatMart!`,
      applicationNumber: application.applicationNumber,
      applicationId: application.id,
      application,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit merchant application.' },
      { status: 500 }
    );
  }
}
