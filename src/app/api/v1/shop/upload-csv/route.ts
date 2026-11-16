import { NextResponse } from 'next/server';
import { shopPartnerStore, CsvProductRow } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, csvContent, rows } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'shopId is required.' },
        { status: 400 }
      );
    }

    let parsedRows: CsvProductRow[] = [];
    let parseErrors: string[] = [];

    if (csvContent && typeof csvContent === 'string') {
      const parsed = shopPartnerStore.parseCsvString(csvContent);
      parsedRows = parsed.rows;
      parseErrors = parsed.errors;
    } else if (Array.isArray(rows)) {
      parsedRows = rows;
    } else {
      return NextResponse.json(
        { success: false, message: 'Please provide either csvContent or rows array.' },
        { status: 400 }
      );
    }

    if (parseErrors.length > 0 && parsedRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'CSV parsing failed.', errors: parseErrors },
        { status: 400 }
      );
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid product rows found to import.' },
        { status: 400 }
      );
    }

    const result = shopPartnerStore.ingestBulkCsvProducts(shopId, parsedRows);

    return NextResponse.json({
      success: result.success,
      message: `Successfully ingested ${result.importedCount} products into the live storefront catalog!`,
      importedCount: result.importedCount,
      totalProcessed: result.totalProcessed,
      errors: [...parseErrors, ...result.errors],
      products: result.products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Bulk CSV ingestion failed.' },
      { status: 500 }
    );
  }
}
