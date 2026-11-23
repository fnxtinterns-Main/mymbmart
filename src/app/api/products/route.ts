import { NextResponse } from 'next/server';
import { getCatalogProducts, syncCatalogFromRedis } from '@/lib/catalog';
import { searchIndex } from '@/lib/searchIndex';
import { getCdnImageUrl } from '@/lib/cdnImage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const fulfilmentType = searchParams.get('fulfilmentType');
    const isSHG = searchParams.get('isSHG');
    const sort = searchParams.get('sort'); // 'savings_desc', 'price_asc', 'price_desc'
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    await syncCatalogFromRedis();
    const catalog = getCatalogProducts();

    // High-speed Inverted Index Search & Filter
    searchIndex.initialize(catalog);
    const { items: indexedItems } = searchIndex.search({
      query: search || undefined,
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      shgOnly: isSHG === 'true',
      sortBy: (sort as any) || undefined,
    });

    let filtered = indexedItems;

    if (fulfilmentType && fulfilmentType !== 'ALL') {
      filtered = filtered.filter(
        (p) => p.fulfilmentType === fulfilmentType
      );
    }

    // Pagination
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const totalCount = filtered.length;

    let paginated = filtered;
    let page = 1;
    let limit = totalCount;
    let totalPages = 1;

    if (pageParam || limitParam) {
      page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
      limit = Math.max(1, Math.min(100, parseInt(limitParam || '24', 10) || 24));
      totalPages = Math.ceil(totalCount / limit) || 1;
      const startIndex = (page - 1) * limit;
      paginated = filtered.slice(startIndex, startIndex + limit);
    }

    // Resolve images through CDN delivery pipeline
    const productsWithCdn = paginated.map((p) => {
      const img = getCdnImageUrl((p as any).imageUrl || p.image, { width: 400, quality: 80, format: 'webp' });
      return {
        ...p,
        image: img,
        imageUrl: img,
      };
    });

    return NextResponse.json(
      {
        success: true,
        totalCount,
        page,
        limit,
        totalPages,
        categories: ['All', 'Groceries', 'SHG Specials', 'Daily Essentials', 'Spices', 'Home & Kitchen'],
        fulfilmentOptions: ['ALL', 'QUICK_COMMERCE', 'STANDARD_MARKETPLACE'],
        products: productsWithCdn,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
