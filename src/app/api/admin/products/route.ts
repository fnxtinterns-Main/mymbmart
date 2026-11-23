import { NextResponse } from 'next/server';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    totalProducts: CATALOG_PRODUCTS.length,
    products: CATALOG_PRODUCTS,
  });
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const ADMIN_PIN = process.env.ADMIN_PIN || 'MBM@Admin2026';
    const isAdmin = 
      cookieHeader.includes('mbm_admin_authenticated=true') ||
      (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === ADMIN_PIN);

    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, stockQuantity, bachatPrice, mrp, inStock } = body;

    const product = CATALOG_PRODUCTS.find((p) => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (bachatPrice !== undefined) product.bachatPrice = Number(bachatPrice);
    if (mrp !== undefined) product.mrp = Number(mrp);
    if (inStock !== undefined) product.inStock = Boolean(inStock);

    return NextResponse.json({
      success: true,
      message: `Product ${product.name} updated successfully in Ranchi Dark Store.`,
      product,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Product update failed' }, { status: 500 });
  }
}
