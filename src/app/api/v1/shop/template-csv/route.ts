import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DEFAULT_CSV = `productId,productName,category,unit,mrp,bachatPrice,stockQuantity,expiryDate,batchNumber,image,isReturnable
RCH-KRN-101,Fortune Sunlite Refined Sunflower Oil,Groceries,1 Litre Pouch,160,138,60,2027-04-15,BCH-FTN-2026-A1,RCH-KRN-101.jpg,true
RCH-KRN-102,Tata Tea Gold Premium Assam Blended Tea,Daily Essentials,500 g,330,285,40,2027-08-20,BCH-TTG-2026-X4,RCH-KRN-102.jpg,true
RCH-KRN-103,Aashirvaad Superior MP Sharbati Whole Wheat Atta,Groceries,5 kg Pack,295,249,50,2026-12-10,BCH-ASH-2026-M2,RCH-KRN-103.jpg,true
RCH-KRN-104,Britannia Good Day Butter Cookies Value Family Pack,Daily Essentials,600 g (Pack of 5),120,96,75,2027-02-28,BCH-BRT-2026-K9,RCH-KRN-104.jpg,false
RCH-KRN-105,Dettol Original Germ Protection Antiseptic Liquid,Daily Essentials,550 ml Bottle,215,189,35,2028-06-30,BCH-DTL-2026-D3,RCH-KRN-105.jpg,true
RCH-KRN-106,Handcrafted Organic Chana Dal Badi (Vadi),SHG Specials,400 g Pack,180,140,45,2026-11-30,BCH-VAD-2026-S1,RCH-KRN-106.jpg,true`;

export async function GET() {
  let csvContent = '';
  try {
    const filePath = path.join(process.cwd(), 'public', 'megabachatmart_inventory_template.csv');
    if (fs.existsSync(filePath)) {
      const read = fs.readFileSync(filePath, 'utf8');
      if (read && read.includes('image,')) {
        csvContent = read;
      }
    }
  } catch {}

  if (!csvContent) {
    csvContent = DEFAULT_CSV;
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="megabachatmart_inventory_template.csv"',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
