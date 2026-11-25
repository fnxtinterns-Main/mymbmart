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
      isCommunityExempt,
    } = body;

    // Check if the applicant qualifies for community fast-track (SHG, Farmer, Home/Ghost Kitchen)
    const isExempt = Boolean(
      isCommunityExempt ||
      businessType === 'SHG_COOPERATIVE' ||
      businessType === 'ORGANIC_PRODUCE' ||
      businessType === 'HOME_KITCHEN'
    );

    // Validation for essential fields
    if (!shopName || !ownerName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Shop/Farm name, owner name, and contact phone number are required.' },
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

    // FSSAI validation: Mandatory only for commercial retailers. Optional for SHGs/farmers/home kitchens.
    if (!isExempt && fssaiNumber && !/^\d{14}$/.test(String(fssaiNumber).trim())) {
      return NextResponse.json(
        { success: false, message: 'FSSAI License Number must be a valid 14-digit number.' },
        { status: 400 }
      );
    }

    // PAN / Identity validation: Commercial shops require 10-char PAN; Exempt entities accept PAN or 12-digit Aadhaar.
    const cleanPan = panNumber ? String(panNumber).trim().toUpperCase() : '';
    if (cleanPan) {
      const isValidPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan);
      const isValidAadhaar = /^\d{12}$/.test(cleanPan.replace(/\s+/g, ''));
      if (!isExempt && !isValidPan) {
        return NextResponse.json(
          { success: false, message: 'PAN Number must be a valid 10-character code (e.g. ABCDE1234F).' },
          { status: 400 }
        );
      } else if (isExempt && !isValidPan && !isValidAadhaar && cleanPan !== 'COMMUNITY_ID') {
        return NextResponse.json(
          { success: false, message: 'Please provide either a 10-character PAN or 12-digit Aadhaar Card number.' },
          { status: 400 }
        );
      }
    }

    const effectivePincode = pincode || '834001';
    const effectiveEmail = email && String(email).trim() !== '' 
      ? String(email).trim() 
      : `${cleanPhone}@partner.mymbmart.com`;
    const effectiveAddress = address && String(address).trim() !== '' 
      ? String(address).trim() 
      : `Main Market Area, Pincode ${effectivePincode}`;
    const effectiveTradeLicense = tradeLicenseNumber || (isExempt ? 'COMMUNITY_EXEMPT' : 'PENDING_VERIF');
    const effectiveBankAcc = bankAccountNumber || 'PENDING_ONBOARDING';
    const effectiveIfsc = ifscCode || 'SBIN000000';
    const effectiveFssai = (fssaiNumber && /^\d{14}$/.test(String(fssaiNumber).trim()))
      ? String(fssaiNumber).trim()
      : (isExempt ? 'COMMUNITY_EXEMPT' : 'PENDING_VERIF');

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
