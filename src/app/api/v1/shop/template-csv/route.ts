import { NextResponse } from 'next/server';
import { shopPartnerStore } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const csvContent = shopPartnerStore.generateSampleCsvTemplate();

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="megabachatmart_inventory_template.csv"',
    },
  });
}
