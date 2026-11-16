import { NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const fulfilmentType = searchParams.get('fulfilmentType');
    const isSHG = searchParams.get('isSHG');
    const sort = searchParams.get('sort'); // 'savings_desc', 'price_asc', 'price_desc'

    let filtered = [...getCatalogProducts()];

    if (category && category !== 'All') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (fulfilmentType && fulfilmentType !== 'ALL') {
      filtered = filtered.filter(
        (p) => p.fulfilmentType === fulfilmentType
      );
    }

    if (isSHG !== null && isSHG !== undefined) {
      const boolVal = isSHG === 'true';
      filtered = filtered.filter((p) => p.isSHG === boolVal);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.producerName && p.producerName.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sort === 'savings_desc') {
      filtered.sort((a, b) => (b.mrp - b.bachatPrice) - (a.mrp - a.bachatPrice));
    } else if (sort === 'price_asc') {
      filtered.sort((a, b) => a.bachatPrice - b.bachatPrice);
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => b.bachatPrice - a.bachatPrice);
    }

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      categories: ['All', 'Groceries', 'SHG Specials', 'Daily Essentials', 'Spices', 'Home & Kitchen'],
      fulfilmentOptions: ['ALL', 'QUICK_COMMERCE', 'STANDARD_MARKETPLACE'],
      products: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
