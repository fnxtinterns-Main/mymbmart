import { NextResponse } from 'next/server';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    totalProducts: CATALOG_PRODUCTS.length,
    products: CATALOG_PRODUCTS,
  });
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
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

    // Persist to PostgreSQL and Redis
    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.product.updateMany({
          where: { OR: [{ id }, { sku: product.sku }] },
          data: {
            ...(bachatPrice !== undefined ? { bachatPrice: Number(bachatPrice) } : {}),
            ...(mrp !== undefined ? { mrp: Number(mrp) } : {}),
            ...(inStock !== undefined ? { inStock: Boolean(inStock) } : {}),
          },
        });
      } catch (dbErr) {
        console.warn('Prisma product update notice:', dbErr);
      }
    }

    try {
      const { redisSet, isRedisConfigured } = await import('@/lib/redis');
      if (isRedisConfigured()) {
        await redisSet(`product:${product.id}`, product).catch(() => {});
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Product ${product.name} updated successfully in Ranchi Dark Store.`,
      product,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Product update failed' }, { status: 500 });
  }
}
