import { sampleProducts } from '@/lib/data';
import type { ProductItem } from '@/lib/types';
import { isRedisConfigured, redisGet, redisSet } from '@/lib/redis';

// Base seed products
const INITIAL_PRODUCTS = [
  ...sampleProducts.map((p) => ({
    ...p,
    fulfilmentType: p.category === 'Home & Kitchen' ? 'STANDARD_MARKETPLACE' : 'QUICK_COMMERCE',
    deliveryEta: p.category === 'Home & Kitchen' ? '2-3 Days' : '20-30 Mins',
    sku: `MBM-SKU-${p.id.toUpperCase()}`,
    stockQuantity: p.inStock ? 50 : 0,
    cashbackPct: Math.round((p.cashbackAmount / p.bachatPrice) * 100),
    referralPct: Math.round((p.referralRewardAmount / p.bachatPrice) * 100),
  })),
];

// Global in-memory singleton to persist dynamically uploaded shop products
const globalForCatalog = globalThis as unknown as {
  dynamicCatalogProducts?: any[];
};

if (!globalForCatalog.dynamicCatalogProducts) {
  globalForCatalog.dynamicCatalogProducts = [...INITIAL_PRODUCTS];
}

export async function syncCatalogFromRedis(): Promise<any[]> {
  // 1. Hydrate from PostgreSQL database (Authoritative Source of Truth)
  try {
    const { prisma } = await import('./prisma');
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });
    if (dbProducts && dbProducts.length > 0) {
      const current = getCatalogProducts();
      for (const p of dbProducts) {
        const mapped = {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category?.name || 'Groceries',
          unit: p.unit,
          mrp: p.mrp,
          bachatPrice: p.bachatPrice,
          discountPercent: p.discountPct,
          cashbackAmount: Math.round((p.cashbackPct / 100) * p.bachatPrice),
          referralRewardAmount: Math.round(p.bachatPrice * 0.05),
          image: p.imageUrl,
          isSHG: p.isSHG,
          inStock: true,
          fulfilmentType: p.fulfilmentType,
          deliveryEta: p.fulfilmentType === 'STANDARD_MARKETPLACE' ? '2-3 Days' : '20-30 Mins',
          stockQuantity: 50,
          cashbackPct: p.cashbackPct,
          referralPct: 5,
        };
        const idx = current.findIndex((c) => c.id === mapped.id || c.sku === mapped.sku);
        if (idx >= 0) current[idx] = mapped;
        else current.unshift(mapped);
      }
    }
  } catch {}

  // 2. Hydrate from Upstash Redis distributed cache
  if (isRedisConfigured()) {
    try {
      const remote = await redisGet<any[]>('catalog:custom_products');
      if (Array.isArray(remote) && remote.length > 0) {
        const current = getCatalogProducts();
        for (const r of remote) {
          if (!current.some((c) => c.id === r.id || c.sku === r.sku)) {
            current.unshift(r);
          }
        }
      }
    } catch {}
  }
  return getCatalogProducts();
}

export function getCatalogProducts(): any[] {
  if (!globalForCatalog.dynamicCatalogProducts) {
    globalForCatalog.dynamicCatalogProducts = [...INITIAL_PRODUCTS];
  }
  return globalForCatalog.dynamicCatalogProducts;
}

export function addCatalogProducts(newProducts: ProductItem[]): void {
  const current = getCatalogProducts();
  newProducts.forEach((np) => {
    const formatted = {
      ...np,
      fulfilmentType: np.category === 'Home & Kitchen' ? 'STANDARD_MARKETPLACE' : 'QUICK_COMMERCE',
      deliveryEta: '20-30 Mins',
      sku: `MBM-SKU-${np.id.toUpperCase()}`,
      stockQuantity: np.inStock ? 50 : 0,
      cashbackPct: Math.round((np.cashbackAmount / np.bachatPrice) * 100),
      referralPct: Math.round((np.referralRewardAmount / np.bachatPrice) * 100),
    };

    const existingIdx = current.findIndex((p) => p.id === formatted.id);
    if (existingIdx >= 0) {
      current[existingIdx] = formatted;
    } else {
      // Add newly uploaded partner product right to the front so consumers see it immediately!
      current.unshift(formatted);
    }
  });

  // 1. Sync to Redis cache
  if (isRedisConfigured()) {
    redisSet('catalog:custom_products', current).catch(() => {});
  }

  // 2. Asynchronously persist to PostgreSQL permanent database
  import('./prisma').then(async ({ prisma }) => {
    try {
      let defaultCat = await prisma.category.findFirst();
      if (!defaultCat) {
        defaultCat = await prisma.category.create({
          data: { name: 'Groceries', slug: 'groceries' },
        });
      }
      for (const np of newProducts) {
        const skuCode = `MBM-SKU-${np.id.toUpperCase()}`;
        await prisma.product.upsert({
          where: { sku: skuCode },
          update: {
            name: np.name,
            mrp: np.mrp,
            bachatPrice: np.bachatPrice,
            imageUrl: np.image,
          },
          create: {
            id: np.id,
            sku: skuCode,
            name: np.name,
            slug: `prod-${np.id.toLowerCase()}-${Date.now().toString().slice(-4)}`,
            categoryId: defaultCat.id,
            unit: np.unit || '1 Unit',
            mrp: np.mrp,
            bachatPrice: np.bachatPrice,
            discountPct: np.discountPercent || 0,
            imageUrl: np.image,
            isSHG: Boolean(np.isSHG),
            fulfilmentType: np.category === 'Home & Kitchen' ? 'STANDARD_MARKETPLACE' : 'QUICK_COMMERCE',
          },
        });
      }
    } catch (dbErr) {
      console.warn('PostgreSQL product catalog upsert deferred:', dbErr);
    }
  }).catch(() => {});
}

// Backward compatible export
export const CATALOG_PRODUCTS = getCatalogProducts();
