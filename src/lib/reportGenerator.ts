// MegaBachatMart — Financial, Sales, Refund & Credit Line Report Generator
// Generates standardized audit statements for Shop Partners and Platform Admins

export interface ShopReportData {
  shopId: string;
  shopName: string;
  ownerName: string;
  pincode: string;
  dateRange: string;
  grossSales: number;
  totalOrders: number;
  refundsDeducted: number;
  creditLineLimit: number;
  creditLineUtilized: number;
  creditLineAvailable: number;
  commissionSaved: number;
  netPayoutTransferred: number;
}

/**
 * Generate CSV Report for a Specific Partner Shop
 */
export function generateShopReportCsv(data: ShopReportData): string {
  const timestamp = new Date().toISOString();
  
  const headers = [
    'Date',
    'Transaction_Type',
    'Reference_ID',
    'Customer_Name',
    'Items_Count',
    'Gross_Amount_INR',
    'MegaBachatMart_Commission_INR',
    'Refund_Deduction_INR',
    'Credit_Line_Adjustment_INR',
    'Net_Settlement_INR',
    'Status'
  ].join(',');

  const rows = [
    `"${new Date().toLocaleDateString('en-IN')}","ORDER_DISPATCH","ORD-2026-9081","Ananya Sen","3","1280.00","0.00 (0%)","0.00","0.00","1280.00","SETTLED_T1"`,
    `"${new Date().toLocaleDateString('en-IN')}","ORDER_DISPATCH","ORD-2026-9082","Vikram Singh","5","2150.00","0.00 (0%)","0.00","0.00","2150.00","SETTLED_T1"`,
    `"${new Date().toLocaleDateString('en-IN')}","ORDER_DISPATCH","ORD-2026-9085","Kavita Soren","2","640.00","0.00 (0%)","0.00","0.00","640.00","SETTLED_T1"`,
    `"${new Date().toLocaleDateString('en-IN')}","ORDER_DISPATCH","ORD-2026-9089","Rajesh Verma","4","820.00","0.00 (0%)","0.00","0.00","820.00","PENDING_T1"`,
    `"${new Date().toLocaleDateString('en-IN')}","CUSTOMER_REFUND","REF-2026-102","Deepak Oraon","1","-140.00","0.00","140.00","0.00","-140.00","REVERSED_UPI"`,
    `"${new Date().toLocaleDateString('en-IN')}","CREDIT_LINE_DRAW","CRD-WH-091","Wholesale Atta Depot","0","0.00","0.00","0.00","24500.00","0.00","ACTIVE_0_PCT_INTEREST"`,
  ];

  const summary = [
    '',
    `"=== SHOP FINANCIAL SUMMARY FOR ${data.shopName.toUpperCase()} ==="`,
    `"Store ID: ${data.shopId}"`,
    `"Owner: ${data.ownerName}"`,
    `"Pincode: ${data.pincode}"`,
    `"Statement Generated: ${timestamp}"`,
    `"Total Orders Fulfilled: ${data.totalOrders}"`,
    `"Gross Sales (GMV): INR ${data.grossSales.toFixed(2)}"`,
    `"Total Customer Refunds: INR ${data.refundsDeducted.toFixed(2)}"`,
    `"Platform Commission Paid: INR 0.00 (0% Promotional Rate)"`,
    `"Commission Saved vs Monopolies (25% rate): INR ${data.commissionSaved.toFixed(2)}"`,
    `"Working Capital Credit Line Approved: INR ${data.creditLineLimit.toFixed(2)}"`,
    `"Working Capital Utilized: INR ${data.creditLineUtilized.toFixed(2)}"`,
    `"Working Capital Available: INR ${data.creditLineAvailable.toFixed(2)}"`,
    `"Net Daily Payout Transferred to Bank: INR ${data.netPayoutTransferred.toFixed(2)}"`,
  ].join('\n');

  return `${headers}\n${rows.join('\n')}\n${summary}`;
}

/**
 * Generate Master Platform Consolidated Report for Admin (All Partners)
 */
export function generateMasterPlatformReportCsv(partners: any[] = []): string {
  const timestamp = new Date().toISOString();

  const headers = [
    'Partner_ID',
    'Shop_Name',
    'Owner_Name',
    'Phone',
    'Pincode',
    'Business_Type',
    'Total_Orders',
    'Gross_GMV_INR',
    'Refunds_INR',
    'Credit_Line_Limit_INR',
    'Credit_Line_Drawn_INR',
    'Credit_Line_Available_INR',
    'Commission_Earned_INR',
    'Net_Disbursed_INR',
    'Status'
  ].join(',');

  const defaultPartners = partners.length > 0 ? partners : [
    {
      shopId: 'MBM-SHP-834006-03',
      shopName: 'Chotanagpur Tribal & Kirana Hub',
      ownerName: 'Sunita Soren',
      phone: '9431109876',
      pincode: '834006',
      businessType: 'SHG_COOPERATIVE',
      totalOrders: 14,
      gmv: 34500,
      refunds: 140,
      creditLimit: 100000,
      creditDrawn: 24500,
      status: 'ACTIVE',
    },
    {
      shopId: 'MBM-SHP-834001-01',
      shopName: 'Ranchi Central Kirana & General Store',
      ownerName: 'Manoj Kumar Gupta',
      phone: '9835012345',
      pincode: '834001',
      businessType: 'KIRANA_GENERAL',
      totalOrders: 38,
      gmv: 89400,
      refunds: 220,
      creditLimit: 250000,
      creditDrawn: 65000,
      status: 'ACTIVE',
    },
    {
      shopId: 'MBM-SHP-834002-02',
      shopName: 'Doranda Organic Staples Co-op',
      ownerName: 'Poonam Devi',
      phone: '9430156789',
      pincode: '834002',
      businessType: 'SHG_COOPERATIVE',
      totalOrders: 21,
      gmv: 48900,
      refunds: 0,
      creditLimit: 150000,
      creditDrawn: 12000,
      status: 'ACTIVE',
    },
    {
      shopId: 'MBM-SHP-834005-04',
      shopName: 'Bariatu Daily Essentials Mart',
      ownerName: 'Sanjay Pandey',
      phone: '9431789012',
      pincode: '834005',
      businessType: 'SUPERMARKET',
      totalOrders: 45,
      gmv: 112000,
      refunds: 410,
      creditLimit: 300000,
      creditDrawn: 95000,
      status: 'ACTIVE',
    }
  ];

  const rows = defaultPartners.map((p) => {
    const availableCredit = (p.creditLimit || 100000) - (p.creditDrawn || 0);
    const netDisbursed = (p.gmv || 0) - (p.refunds || 0);
    return `"${p.shopId}","${p.shopName}","${p.ownerName}","${p.phone}","${p.pincode}","${p.businessType}","${p.totalOrders || 0}","${p.gmv?.toFixed(2) || '0.00'}","${p.refunds?.toFixed(2) || '0.00'}","${p.creditLimit?.toFixed(2) || '100000.00'}","${p.creditDrawn?.toFixed(2) || '0.00'}","${availableCredit.toFixed(2)}","0.00 (0% promo)","${netDisbursed.toFixed(2)}","${p.status || 'ACTIVE'}"`;
  });

  const totalGmv = defaultPartners.reduce((acc, p) => acc + (p.gmv || 0), 0);
  const totalRefunds = defaultPartners.reduce((acc, p) => acc + (p.refunds || 0), 0);
  const totalCreditAllocated = defaultPartners.reduce((acc, p) => acc + (p.creditLimit || 0), 0);
  const totalCreditInUse = defaultPartners.reduce((acc, p) => acc + (p.creditDrawn || 0), 0);

  const summary = [
    '',
    `"=== MEGABACHATMART ALL-PARTNER MASTER CONSOLIDATED AUDIT ==="`,
    `"Generated At: ${timestamp}"`,
    `"Total Registered Partners: ${defaultPartners.length}"`,
    `"Total Platform GMV: INR ${totalGmv.toFixed(2)}"`,
    `"Total Platform Customer Refunds: INR ${totalRefunds.toFixed(2)}"`,
    `"Total Working Capital Credit Line Extended: INR ${totalCreditAllocated.toFixed(2)}"`,
    `"Total Credit Capital In Use: INR ${totalCreditInUse.toFixed(2)}"`,
    `"Net Merchant Settlements Disbursed: INR ${(totalGmv - totalRefunds).toFixed(2)}"`,
    `"Platform Commission: 0% (Promotional Period - INR ${(totalGmv * 0.25).toFixed(2)} saved for local shopkeepers)"`,
  ].join('\n');

  return `${headers}\n${rows.join('\n')}\n${summary}`;
}

/**
 * Trigger Instant Browser File Download
 */
export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
