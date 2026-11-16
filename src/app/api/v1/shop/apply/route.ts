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

    // Validation
    if (!shopName || !ownerName || !phone || !email || !address || !pincode) {
      return NextResponse.json(
        { success: false, message: 'Shop name, owner name, phone, email, address, and pincode are required.' },
        { status: 400 }
      );
    }

    if (!fssaiNumber || !tradeLicenseNumber) {
      return NextResponse.json(
        { success: false, message: 'FSSAI registration number and Trade License number are mandatory for verification.' },
        { status: 400 }
      );
    }

    if (!bankAccountNumber || !ifscCode) {
      return NextResponse.json(
        { success: false, message: 'Bank account number and IFSC code are required for merchant settlement payouts.' },
        { status: 400 }
      );
    }

    const application = shopPartnerStore.submitApplication({
      shopName,
      ownerName,
      phone,
      email,
      address,
      city: city || 'Ranchi',
      state: state || 'Jharkhand',
      pincode,
      businessType: businessType || 'KIRANA_GENERAL',
      yearsInBusiness: Number(yearsInBusiness) || 1,
      fssaiNumber,
      tradeLicenseNumber,
      gstin,
      panNumber: panNumber || 'ABCDE1234F',
      bankName: bankName || 'State Bank of India',
      bankAccountNumber,
      ifscCode,
      documents,
    });

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
