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
export function generateShopReportCsv(data: ShopReportData, orders: any[] = []): string {
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

  const rows = orders.length > 0
    ? orders.map((o) => {
        const amt = (o.totalPayable || o.total || 0).toFixed(2);
        const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : 'Not Available';
        return `"${dateStr}","ORDER_DISPATCH","${o.orderNumber || o.id}","${o.userName || o.customerName || 'Customer'}","${o.items?.length || 0}","${amt}","0.00 (0%)","0.00","0.00","${amt}","${o.status || 'SETTLED'}"`;
      })
    : [
        `"${new Date().toLocaleDateString('en-IN')}","NO_TRANSACTIONS","N/A","No transactions recorded","0","0.00","0.00","0.00","0.00","0.00","N/A"`
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

  const actualPartners = Array.isArray(partners) ? partners : [];

  const rows = actualPartners.length > 0
    ? actualPartners.map((p) => {
        const creditLimit = (p as any).creditLimit || 0;
        const creditDrawn = (p as any).creditDrawn || 0;
        const availableCredit = Math.max(0, creditLimit - creditDrawn);
        const gmv = (p as any).gmv || 0;
        const refunds = (p as any).refunds || 0;
        const netDisbursed = Math.max(0, gmv - refunds);
        return `"${p.shopId}","${p.shopName}","${p.ownerName}","${p.phone || 'Not Available'}","${p.pincode || 'Not Available'}","${p.businessType || 'Not Available'}","${(p as any).totalOrdersFulfilled || 0}","${gmv.toFixed(2)}","${refunds.toFixed(2)}","${creditLimit.toFixed(2)}","${creditDrawn.toFixed(2)}","${availableCredit.toFixed(2)}","0.00","${netDisbursed.toFixed(2)}","${p.status || 'ACTIVE'}"`;
      })
    : [
        `"N/A","No Registered Partners","Not Available","Not Available","Not Available","Not Available","0","0.00","0.00","0.00","0.00","0.00","0.00","0.00","NOT_AVAILABLE"`
      ];

  const totalGmv = actualPartners.reduce((acc, p: any) => acc + (p.gmv || 0), 0);
  const totalRefunds = actualPartners.reduce((acc, p: any) => acc + (p.refunds || 0), 0);
  const totalCreditAllocated = actualPartners.reduce((acc, p: any) => acc + (p.creditLimit || 0), 0);
  const totalCreditInUse = actualPartners.reduce((acc, p: any) => acc + (p.creditDrawn || 0), 0);

  const summary = [
    '',
    `"=== MEGABACHATMART ALL-PARTNER MASTER CONSOLIDATED AUDIT ==="`,
    `"Generated At: ${timestamp}"`,
    `"Total Registered Partners: ${actualPartners.length}"`,
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
