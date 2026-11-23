// src/app/api/products/recommendations/route.ts
// Product Recommendations & Visual Search API

import { NextResponse } from 'next/server';
import { getSimilarProducts, getFrequentlyBoughtTogether, visualSearch } from '@/lib/recommendations';
import { getCdnImageUrl } from '@/lib/cdnImage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type') || 'similar'; // 'similar' | 'frequently_bought'
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    let items = type === 'frequently_bought' 
      ? getFrequentlyBoughtTogether(productId, limit)
      : getSimilarProducts(productId, limit);

    // CDN image delivery
    const itemsWithCdn = items.map((p) => {
      const img = getCdnImageUrl((p as any).imageUrl || p.image, { width: 300, quality: 80, format: 'webp' });
      return {
        ...p,
        image: img,
        imageUrl: img,
      };
    });

    return NextResponse.json(
      {
        success: true,
        type,
        items: itemsWithCdn,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { labels, categoryHint, limit = 6 } = body;

    const result = visualSearch(labels || [], categoryHint, limit);
    const itemsWithCdn = result.products.map((p) => {
      const img = getCdnImageUrl((p as any).imageUrl || p.image, { width: 300, quality: 80, format: 'webp' });
      return {
        ...p,
        image: img,
        imageUrl: img,
      };
    });

    return NextResponse.json({
      success: true,
      confidence: result.confidence,
      items: itemsWithCdn,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
