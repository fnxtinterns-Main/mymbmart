// MegaBachatMart — Merchant Onboarding & Shop Partner Store
// Handles Partner Registration, KYC verification, Admin Approvals, Credential Dispatch,
// and Bulk CSV Inventory Ingestion with instant Live Storefront synchronization.

import { ProductItem } from './types';
import { inventoryStore } from './inventoryStore';
import { addCatalogProducts, getCatalogProducts } from './catalog';
import { productImageLibrary } from './productImageLibrary';

export type BusinessType = 
  | 'KIRANA_GENERAL' 
  | 'ORGANIC_PRODUCE' 
  | 'DAIRY_SWEETS' 
  | 'SUPERMARKET' 
  | 'SHG_COOPERATIVE';

export type ApplicationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED';

export interface ShopApplication {
  id: string;
  applicationNumber: string; // e.g. "APP-RCH-2026-081"
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessType: BusinessType;
  yearsInBusiness: number;
  fssaiNumber: string;
  tradeLicenseNumber: string;
  gstin?: string;
  panNumber: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  documents: {
    tradeLicenseUrl: string;
    fssaiCertUrl: string;
    panCardUrl: string;
    storePhotoUrl: string;
  };
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  generatedShopId?: string;
  generatedPassword?: string;
  dispatchedAt?: string;
  dispatchChannels?: ('WHATSAPP' | 'EMAIL')[];
  notificationDetails?: {
    whatsappMessage: string;
    emailSubject: string;
    emailBody: string;
    portalUrl: string;
  };
}

export interface ShopPartnerAccount {
  shopId: string; // e.g. "MBM-SHP-834001-09"
  applicationId: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string; // Stored securely
  pincode: string;
  address: string;
  businessType: BusinessType;
  fssaiNumber: string;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
  totalProductsListed: number;
  totalStockUnits: number;
  totalOrdersFulfilled: number;
  rating: number;
}

export interface CsvProductRow {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  mrp: number;
  bachatPrice: number;
  stockQuantity: number;
  expiryDate: string;
  batchNumber: string;
  imageUrl?: string;
  isReturnable?: boolean;
}

export interface IngestionResult {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  errors: string[];
  products: ProductItem[];
}

// Initial realistic seed applications for Ranchi Central
const INITIAL_APPLICATIONS: ShopApplication[] = [
  {
    id: 'app-rch-081',
    applicationNumber: 'APP-RCH-2026-081',
    shopName: 'Gupta Kirana & General Store',
    ownerName: 'Rajesh Gupta',
    phone: '9876543210',
    email: 'guptakiranaranchi@gmail.com',
    address: 'Shop #14, Main Road, Near Overbridge, Hindpiri',
    city: 'Ranchi',
    state: 'Jharkhand',
    pincode: '834001',
    businessType: 'KIRANA_GENERAL',
    yearsInBusiness: 12,
    fssaiNumber: '11521018000456',
    tradeLicenseNumber: 'RMC/TL/2024/9912',
    gstin: '20AAACG0123M1Z5',
    panNumber: 'ABCDE1234F',
    bankName: 'State Bank of India - Main Branch Ranchi',
    bankAccountNumber: '34891029481',
    ifscCode: 'SBIN0000167',
    documents: {
      tradeLicenseUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      fssaiCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      panCardUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      storePhotoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    },
    status: 'PENDING_REVIEW',
    submittedAt: '2026-11-15T10:30:00.000Z',
  },
  {
    id: 'app-rch-082',
    applicationNumber: 'APP-RCH-2026-082',
    shopName: 'Verma Super Bazaar & Daily Needs',
    ownerName: 'Vikram Verma',
    phone: '9835123456',
    email: 'vermasuperbazaar@yahoo.com',
    address: 'Plot 42, Circular Road, Lalpur Chowk',
    city: 'Ranchi',
    state: 'Jharkhand',
    pincode: '834001',
    businessType: 'SUPERMARKET',
    yearsInBusiness: 7,
    fssaiNumber: '11523019000892',
    tradeLicenseNumber: 'RMC/TL/2025/3341',
    gstin: '20BBBPV5432N1Z8',
    panNumber: 'BBBPV5432N',
    bankName: 'Punjab National Bank - Lalpur',
    bankAccountNumber: '0987110023415',
    ifscCode: 'PUNB0098700',
    documents: {
      tradeLicenseUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      fssaiCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      panCardUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      storePhotoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80',
    },
    status: 'PENDING_REVIEW',
    submittedAt: '2026-11-15T14:15:00.000Z',
  },
  {
    id: 'app-rch-080',
    applicationNumber: 'APP-RCH-2026-080',
    shopName: 'Chotanagpur Tribal & Kirana Hub',
    ownerName: 'Sunita Soren',
    phone: '9431109876',
    email: 'chotanagpurtribalhub@gmail.com',
    address: 'B-9, Kanke Road, Near Birsa Agricultural Univ Gate',
    city: 'Ranchi',
    state: 'Jharkhand',
    pincode: '834006',
    businessType: 'SHG_COOPERATIVE',
    yearsInBusiness: 5,
    fssaiNumber: '11519011000123',
    tradeLicenseNumber: 'RMC/TL/2023/1109',
    panNumber: 'CCCTS9988K',
    bankName: 'Jharkhand Rajya Gramin Bank',
    bankAccountNumber: '887711223344',
    ifscCode: 'JRGB0001002',
    documents: {
      tradeLicenseUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      fssaiCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      panCardUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      storePhotoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80',
    },
    status: 'APPROVED',
    submittedAt: '2026-11-14T09:00:00.000Z',
    reviewedAt: '2026-11-14T11:30:00.000Z',
    reviewedBy: 'Admin (Ranchi Central HQ)',
    reviewNotes: 'All FSSAI and Gramin bank credentials verified. Authorized for SHG & Kirana fulfillment.',
    generatedShopId: 'MBM-SHP-834006-03',
    generatedPassword: 'MBM#Chot834@2026',
    dispatchedAt: '2026-11-14T11:31:00.000Z',
    dispatchChannels: ['WHATSAPP', 'EMAIL'],
    notificationDetails: {
      whatsappMessage: '🛍️ *MegaBachatMart Partner Program — Approved!*\nNamaste Sunita Soren ji! Store *Chotanagpur Tribal & Kirana Hub* is live.',
      emailSubject: 'Welcome to MegaBachatMart! Your Merchant Portal Login Details',
      emailBody: 'Your store has been approved. Login with ID: MBM-SHP-834006-03.',
      portalUrl: '/shop/login',
    },
  },
];

const INITIAL_ACCOUNTS: ShopPartnerAccount[] = [
  {
    shopId: 'MBM-SHP-834006-03',
    applicationId: 'app-rch-080',
    shopName: 'Chotanagpur Tribal & Kirana Hub',
    ownerName: 'Sunita Soren',
    email: 'chotanagpurtribalhub@gmail.com',
    phone: '9431109876',
    passwordHash: 'MBM#Chot834@2026',
    pincode: '834006',
    address: 'B-9, Kanke Road, Near Birsa Agricultural Univ Gate, Ranchi',
    businessType: 'SHG_COOPERATIVE',
    fssaiNumber: '11519011000123',
    status: 'ACTIVE',
    joinedAt: '2026-11-14T11:30:00.000Z',
    totalProductsListed: 3,
    totalStockUnits: 150,
    totalOrdersFulfilled: 14,
    rating: 4.9,
  },
];

class ShopPartnerStore {
  public applications: ShopApplication[] = [...INITIAL_APPLICATIONS];
  public accounts: ShopPartnerAccount[] = [...INITIAL_ACCOUNTS];

  // Retrieve applications with optional status filter
  public getApplications(filter?: ApplicationStatus | 'ALL'): ShopApplication[] {
    if (!filter || filter === 'ALL') {
      return [...this.applications].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    return this.applications
      .filter((app) => app.status === filter)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getApplicationById(id: string): ShopApplication | undefined {
    return this.applications.find((app) => app.id === id || app.applicationNumber === id);
  }

  // Submit new application from storefront Join flow
  public submitApplication(input: {
    shopName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    businessType: BusinessType;
    yearsInBusiness: number;
    fssaiNumber: string;
    tradeLicenseNumber: string;
    gstin?: string;
    panNumber: string;
    bankName: string;
    bankAccountNumber: string;
    ifscCode: string;
    documents?: {
      tradeLicenseUrl?: string;
      fssaiCertUrl?: string;
      panCardUrl?: string;
      storePhotoUrl?: string;
    };
  }): ShopApplication {
    const nextSeq = this.applications.length + 80;
    const appNumber = `APP-RCH-2026-${String(nextSeq).padStart(3, '0')}`;
    const id = `app-rch-${String(nextSeq).padStart(3, '0')}`;

    const newApp: ShopApplication = {
      id,
      applicationNumber: appNumber,
      shopName: input.shopName.trim(),
      ownerName: input.ownerName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      city: input.city.trim() || 'Ranchi',
      state: input.state.trim() || 'Jharkhand',
      pincode: input.pincode.trim() || '834001',
      businessType: input.businessType || 'KIRANA_GENERAL',
      yearsInBusiness: Number(input.yearsInBusiness) || 1,
      fssaiNumber: input.fssaiNumber.trim(),
      tradeLicenseNumber: input.tradeLicenseNumber.trim(),
      gstin: input.gstin?.trim() || undefined,
      panNumber: input.panNumber.trim().toUpperCase(),
      bankName: input.bankName.trim(),
      bankAccountNumber: input.bankAccountNumber.trim(),
      ifscCode: input.ifscCode.trim().toUpperCase(),
      documents: {
        tradeLicenseUrl: input.documents?.tradeLicenseUrl || 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
        fssaiCertUrl: input.documents?.fssaiCertUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        panCardUrl: input.documents?.panCardUrl || 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
        storePhotoUrl: input.documents?.storePhotoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
      },
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
    };

    this.applications.unshift(newApp);
    return newApp;
  }

  // Admin Review & Approval: Generates Shop ID + Password & Dispatches via WhatsApp and Email
  public approveApplication(params: {
    applicationId: string;
    customShopId?: string;
    customPassword?: string;
    adminNotes?: string;
    adminName?: string;
  }): { success: boolean; message: string; account?: ShopPartnerAccount; application?: ShopApplication } {
    const app = this.applications.find((a) => a.id === params.applicationId || a.applicationNumber === params.applicationId);
    if (!app) {
      return { success: false, message: 'Application not found' };
    }

    if (app.status === 'APPROVED') {
      return { success: false, message: 'Application has already been approved.' };
    }

    const pin = app.pincode || '834001';
    const storeCount = this.accounts.length + 1;
    const generatedShopId = params.customShopId || `MBM-SHP-${pin}-${String(storeCount).padStart(2, '0')}`;
    
    // Generate secure human-readable password
    const prefix = app.shopName.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'Shop';
    const generatedPassword = params.customPassword || `MBM#${prefix}${pin.slice(-3)}@2026`;

    const portalUrl = '/shop/login';

    const whatsappMessage = `🛍️ *MegaBachatMart Partner Program — Approved!*

Namaste *${app.ownerName}* ji!
Congratulations! Your store *${app.shopName}* has been officially approved as a MegaBachatMart Verified Merchant Partner for Pincode *${app.pincode}*.

🔑 *Your Merchant Portal Access Credentials:*
• *Merchant Portal:* https://mymbmart.com${portalUrl}
• *Store ID / Username:* \`${generatedShopId}\`
• *Secure Password:* \`${generatedPassword}\`

📦 *Next Step:*
1. Click the portal link above and sign in with your credentials.
2. Download our Bulk CSV Inventory Template.
3. Upload your stock with your Bachat prices.
4. Your products will instantly appear on the live storefront for local consumers to order!

📞 *Partner Helpline:* 1800-890-MBMART (Mon-Sun 8 AM - 10 PM)
*MegaBachatMart Partner Operations, Ranchi HQ*`;

    const emailSubject = `Welcome to MegaBachatMart! Your Merchant Partner Account (${generatedShopId}) is Active`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0F172A; line-height: 1.6;">
        <div style="background-color: #064E3B; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 22px;">MegaBachatMart Partner Program</h1>
          <p style="color: #6EE7B7; margin: 5px 0 0 0; font-size: 14px;">Merchant Account Approval & Activation</p>
        </div>
        <div style="background-color: #FFFFFF; padding: 28px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Dear <strong>${app.ownerName}</strong>,</p>
          <p>We are delighted to confirm that your application (<strong>${app.applicationNumber}</strong>) for <strong>${app.shopName}</strong> has been approved by the Ranchi Central onboarding desk.</p>
          
          <div style="background-color: #F8FAFC; border-left: 4px solid #16A34A; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <h3 style="margin-top: 0; color: #064E3B; font-size: 16px;">Your Login Credentials</h3>
            <p style="margin: 6px 0;"><strong>Store ID / Username:</strong> <code style="background: #E2E8F0; padding: 3px 6px; border-radius: 4px; font-weight: bold;">${generatedShopId}</code></p>
            <p style="margin: 6px 0;"><strong>Temporary Password:</strong> <code style="background: #E2E8F0; padding: 3px 6px; border-radius: 4px; font-weight: bold;">${generatedPassword}</code></p>
            <p style="margin: 6px 0;"><strong>Merchant Portal:</strong> <a href="https://mymbmart.com${portalUrl}" style="color: #16A34A; font-weight: bold;">https://mymbmart.com${portalUrl}</a></p>
          </div>

          <p>You can now log in, upload your products in bulk via CSV, and start fulfilling 10-30 minute quick commerce orders for your locality.</p>

          <p style="margin-top: 30px; font-size: 13px; color: #64748B;">For onboarding support, contact our merchant success desk at partner@mymbmart.com.</p>
        </div>
      </div>
    `;

    // Update application
    app.status = 'APPROVED';
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = params.adminName || 'Admin (Ranchi Central HQ)';
    app.reviewNotes = params.adminNotes || 'KYC documentation and premises verified.';
    app.generatedShopId = generatedShopId;
    app.generatedPassword = generatedPassword;
    app.dispatchedAt = new Date().toISOString();
    app.dispatchChannels = ['WHATSAPP', 'EMAIL'];
    app.notificationDetails = {
      whatsappMessage,
      emailSubject,
      emailBody,
      portalUrl,
    };

    // Create active partner account
    const account: ShopPartnerAccount = {
      shopId: generatedShopId,
      applicationId: app.id,
      shopName: app.shopName,
      ownerName: app.ownerName,
      email: app.email,
      phone: app.phone,
      passwordHash: generatedPassword,
      pincode: app.pincode,
      address: `${app.address}, ${app.city}, ${app.state}`,
      businessType: app.businessType,
      fssaiNumber: app.fssaiNumber,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      totalProductsListed: 0,
      totalStockUnits: 0,
      totalOrdersFulfilled: 0,
      rating: 5.0,
    };

    // Prevent duplicates
    const existingIdx = this.accounts.findIndex((acc) => acc.shopId === generatedShopId);
    if (existingIdx >= 0) {
      this.accounts[existingIdx] = account;
    } else {
      this.accounts.push(account);
    }

    return {
      success: true,
      message: `Shop approved successfully! Credentials dispatched to WhatsApp (${app.phone}) and Email (${app.email}).`,
      account,
      application: app,
    };
  }

  // Reject application with reason
  public rejectApplication(applicationId: string, reason: string): { success: boolean; message: string } {
    const app = this.applications.find((a) => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) return { success: false, message: 'Application not found' };

    app.status = 'REJECTED';
    app.reviewedAt = new Date().toISOString();
    app.reviewNotes = reason;

    return { success: true, message: `Application ${app.applicationNumber} has been rejected.` };
  }

  // Authenticate shop partner by Store ID or Phone
  public authenticateShop(identifier: string, password: string): ShopPartnerAccount | null {
    const cleanId = identifier.trim().toLowerCase();
    const account = this.accounts.find(
      (a) => (a.shopId.toLowerCase() === cleanId || a.phone === cleanId || a.email.toLowerCase() === cleanId) &&
             a.passwordHash === password.trim()
    );
    return account || null;
  }

  public getAccount(shopId: string): ShopPartnerAccount | undefined {
    return this.accounts.find((a) => a.shopId === shopId);
  }

  // Standard CSV Template Generator
  public generateSampleCsvTemplate(): string {
    const headers = [
      'productId',
      'productName',
      'category',
      'unit',
      'mrp',
      'bachatPrice',
      'stockQuantity',
      'expiryDate',
      'batchNumber',
      'imageUrl',
      'isReturnable',
    ];

    const sampleRows = [
      [
        'RCH-KRN-101',
        'Fortune Sunlite Refined Sunflower Oil',
        'Groceries',
        '1 Litre Pouch',
        '160',
        '138',
        '60',
        '2027-04-15',
        'BCH-FTN-2026-A1',
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
        'true',
      ],
      [
        'RCH-KRN-102',
        'Tata Tea Gold Premium Assam Blended Tea',
        'Daily Essentials',
        '500 g',
        '330',
        '285',
        '40',
        '2027-08-20',
        'BCH-TTG-2026-X4',
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
        'true',
      ],
      [
        'RCH-KRN-103',
        'Aashirvaad Superior MP Sharbati Whole Wheat Atta',
        'Groceries',
        '5 kg Pack',
        '295',
        '249',
        '50',
        '2026-12-10',
        'BCH-ASH-2026-M2',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
        'true',
      ],
      [
        'RCH-KRN-104',
        'Britannia Good Day Butter Cookies Value Family Pack',
        'Daily Essentials',
        '600 g (Pack of 5)',
        '120',
        '96',
        '75',
        '2027-02-28',
        'BCH-BRT-2026-K9',
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
        'false',
      ],
      [
        'RCH-KRN-105',
        'Dettol Original Germ Protection Antiseptic Liquid',
        'Daily Essentials',
        '550 ml Bottle',
        '215',
        '189',
        '35',
        '2028-06-30',
        'BCH-DTL-2026-D3',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
        'true',
      ],
      [
        'RCH-KRN-106',
        'Handcrafted Organic Chana Dal Badi (Vadi)',
        'SHG Specials',
        '400 g Pack',
        '180',
        '140',
        '45',
        '2026-11-30',
        'BCH-VAD-2026-S1',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80',
        'true',
      ],
    ];

    const lines = [headers.join(',')];
    sampleRows.forEach((r) => lines.push(r.join(',')));
    return lines.join('\n');
  }

  // Parse CSV string into structured CsvProductRow array
  public parseCsvString(csvString: string): { rows: CsvProductRow[]; errors: string[] } {
    const errors: string[] = [];
    const rows: CsvProductRow[] = [];

    const lines = csvString
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return { rows: [], errors: ['CSV file is empty or missing header line.'] };
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const expectedHeaders = ['productid', 'productname', 'category', 'unit', 'mrp', 'bachatprice', 'stockquantity'];
    for (const exp of expectedHeaders) {
      if (!header.includes(exp)) {
        errors.push(`Missing mandatory column in header: "${exp}"`);
      }
    }

    if (errors.length > 0) {
      return { rows: [], errors };
    }

    const getIdx = (name: string) => header.indexOf(name.toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split supporting quoted strings
      const cols: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim());

      const getColVal = (name: string, fallback = '') => {
        const idx = getIdx(name);
        return idx >= 0 && idx < cols.length ? cols[idx].replace(/^"|"$/g, '').trim() : fallback;
      };

      const pid = getColVal('productId') || `SKU-${Date.now()}-${i}`;
      const name = getColVal('productName');
      const cat = (getColVal('category') || 'Groceries') as any;
      const unit = getColVal('unit') || '1 Unit';
      const mrp = parseFloat(getColVal('mrp')) || 0;
      const bachatPrice = parseFloat(getColVal('bachatPrice')) || mrp;
      const stock = parseInt(getColVal('stockQuantity'), 10) || 10;
      const expiry = getColVal('expiryDate') || '2027-12-31';
      const batch = getColVal('batchNumber') || `BATCH-${Date.now()}`;
      const img = getColVal('imageUrl') || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';
      const ret = getColVal('isReturnable').toLowerCase() !== 'false';

      if (!name) {
        errors.push(`Row ${i + 1}: Product name is required.`);
        continue;
      }
      if (mrp <= 0) {
        errors.push(`Row ${i + 1}: MRP must be greater than 0.`);
        continue;
      }
      if (bachatPrice > mrp) {
        errors.push(`Row ${i + 1}: Bachat Price (₹${bachatPrice}) cannot be higher than MRP (₹${mrp}).`);
        continue;
      }

      rows.push({
        productId: pid,
        productName: name,
        category: cat,
        unit,
        mrp,
        bachatPrice,
        stockQuantity: stock,
        expiryDate: expiry,
        batchNumber: batch,
        imageUrl: img,
        isReturnable: ret,
      });
    }

    return { rows, errors };
  }

  // Bulk Ingestion: Validates CSV and automatically injects products into live storefront catalog and inventory store
  public ingestBulkCsvProducts(shopId: string, rows: CsvProductRow[]): IngestionResult {
    const shop = this.accounts.find((a) => a.shopId === shopId);
    const shopName = shop ? shop.shopName : 'Authorized Local Kirana Partner';
    const pincode = shop ? shop.pincode : '834001';

    const errors: string[] = [];
    const createdProducts: ProductItem[] = [];
    let importedCount = 0;

    for (const row of rows) {
      try {
        const discountPct = Math.round(((row.mrp - row.bachatPrice) / row.mrp) * 100);
        const cashback = Math.max(2, Math.round(row.bachatPrice * 0.05));
        const referral = Math.max(1, Math.round(row.bachatPrice * 0.02));

        const isSHG = row.category === 'SHG Specials' || (shop && shop.businessType === 'SHG_COOPERATIVE');

        const product: ProductItem = {
          id: row.productId.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
          name: row.productName,
          category: row.category,
          unit: row.unit,
          mrp: row.mrp,
          bachatPrice: row.bachatPrice,
          discountPercent: discountPct,
          cashbackAmount: cashback,
          referralRewardAmount: referral,
          image: productImageLibrary.resolveImage({
            productId: row.productId,
            productName: row.productName,
            category: row.category,
            explicitUrl: row.imageUrl,
          }),
          isSHG: Boolean(isSHG),
          producerName: `Sold by: ${shopName} (${pincode})`,
          inStock: row.stockQuantity > 0,
        };

        // Also add to inventory SKU registry and stock bucket
        try {
          const skuCode = `MBM-SKU-${row.productId.toUpperCase()}`;
          const existingSku = inventoryStore.skus.find((s) => s.skuCode === skuCode);
          if (!existingSku) {
            inventoryStore.skus.push({
              id: `sku-${row.productId.toLowerCase()}`,
              skuCode,
              barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
              productName: row.productName,
              brand: shopName,
              category: row.category,
              variantName: row.unit,
              unitOfMeasure: row.unit,
              mrp: row.mrp,
              sellingPrice: row.bachatPrice,
              costPrice: Math.round(row.bachatPrice * 0.88),
              hsnCode: '19041090',
              isBatchTracked: true,
              isExpiryTracked: true,
              isReturnable: row.isReturnable ?? true,
              status: 'ACTIVE',
            });
          }

          const existingBucket = inventoryStore.stockBuckets.find(
            (b) => b.skuCode === skuCode && b.storeId === 'MBM-RCH-01'
          );
          if (existingBucket) {
            existingBucket.onHand += row.stockQuantity;
          } else {
            inventoryStore.stockBuckets.push({
              storeId: 'MBM-RCH-01',
              storeName: 'Ranchi Central Dark Store & Pilot Hub',
              skuId: `sku-${row.productId.toLowerCase()}`,
              skuCode,
              productName: row.productName,
              category: row.category,
              onHand: row.stockQuantity,
              reservedSoft: 0,
              reservedHard: 0,
              damaged: 0,
              quarantined: 0,
              incoming: 0,
              reorderPoint: 15,
              reorderQty: 40,
              updatedAt: new Date().toISOString(),
            });
          }

          inventoryStore.batches.push({
            id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            storeId: 'MBM-RCH-01',
            skuId: `sku-${row.productId.toLowerCase()}`,
            skuCode,
            productName: row.productName,
            batchNumber: row.batchNumber,
            manufactureDate: '2026-01-01',
            expiryDate: row.expiryDate,
            costPrice: Math.round(row.bachatPrice * 0.88),
            receivedQty: row.stockQuantity,
            remainingQty: row.stockQuantity,
            status: 'ACTIVE',
          });
        } catch (invErr) {
          console.warn('Inventory registration non-fatal notice:', invErr);
        }

        createdProducts.push(product);
        importedCount++;
      } catch (err: any) {
        errors.push(`Failed to import ${row.productName}: ${err.message}`);
      }
    }

    // Automatically inject all created products into live storefront catalog
    if (createdProducts.length > 0) {
      addCatalogProducts(createdProducts);
    }

    // Update merchant account stats
    if (shop) {
      shop.totalProductsListed += importedCount;
      const totalUnits = rows.reduce((acc, r) => acc + (r.stockQuantity || 0), 0);
      shop.totalStockUnits += totalUnits;
    }

    return {
      success: importedCount > 0,
      totalProcessed: rows.length,
      importedCount,
      errors,
      products: createdProducts,
    };
  }
}

// Global Singleton to ensure state persistence across API routes and Next.js hot-reloads
const globalForShopPartner = globalThis as unknown as {
  shopPartnerStoreInstance?: ShopPartnerStore;
};

export const shopPartnerStore =
  globalForShopPartner.shopPartnerStoreInstance || new ShopPartnerStore();

if (process.env.NODE_ENV !== 'production') {
  globalForShopPartner.shopPartnerStoreInstance = shopPartnerStore;
}
