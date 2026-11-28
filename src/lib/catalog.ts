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
  lastCatalogSyncAt?: number;
  inFlightCatalogSync?: Promise<any[]> | null;
};

if (!globalForCatalog.dynamicCatalogProducts) {
  globalForCatalog.dynamicCatalogProducts = [...INITIAL_PRODUCTS];
}

const CATALOG_SYNC_TTL_MS = 15_000;

export async function syncCatalogFromRedis(force = false): Promise<any[]> {
  const now = Date.now();
  if (
    !force &&
    globalForCatalog.lastCatalogSyncAt &&
    now - globalForCatalog.lastCatalogSyncAt < CATALOG_SYNC_TTL_MS
  ) {
    return getCatalogProducts();
  }

  if (globalForCatalog.inFlightCatalogSync) {
    return globalForCatalog.inFlightCatalogSync;
  }

  globalForCatalog.inFlightCatalogSync = (async () => {
    try {
      const [dbProducts, remote] = await Promise.all([
        import('./prisma')
          .then(({ prisma }) =>
            prisma.product.findMany({
              where: { isActive: true },
              include: { category: true },
            })
          )
          .catch(() => null),
        isRedisConfigured()
          ? redisGet<any[]>('catalog:custom_products').catch(() => null)
          : Promise.resolve(null),
      ]);

      const current = getCatalogProducts();

      if (dbProducts && dbProducts.length > 0) {
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
            imageUrl: p.imageUrl,
            isSHG: p.isSHG,
            producerName: p.producerName || undefined,
            inStock: (p.stockQuantity ?? 50) > 0,
            fulfilmentType: p.fulfilmentType,
            deliveryEta: p.fulfilmentType === 'STANDARD_MARKETPLACE' ? '2-3 Days' : '20-30 Mins',
            stockQuantity: typeof p.stockQuantity === 'number' ? p.stockQuantity : 50,
            cashbackPct: p.cashbackPct,
            referralPct: 5,
          };
          const idx = current.findIndex((c) => c.id === mapped.id || c.sku === mapped.sku);
          if (idx >= 0) current[idx] = mapped;
          else current.unshift(mapped);
        }
      }

      if (Array.isArray(remote) && remote.length > 0) {
        for (const r of remote) {
          if (!current.some((c) => c.id === r.id || c.sku === r.sku)) {
            current.unshift(r);
          }
        }
      }

      if (dbProducts !== null || remote !== null) {
        globalForCatalog.lastCatalogSyncAt = Date.now();
      }
    } finally {
      globalForCatalog.inFlightCatalogSync = null;
    }
    return getCatalogProducts();
  })();

  return globalForCatalog.inFlightCatalogSync;
}

export function getCatalogProducts(): any[] {
  if (!globalForCatalog.dynamicCatalogProducts) {
    globalForCatalog.dynamicCatalogProducts = [...INITIAL_PRODUCTS];
  }
  return globalForCatalog.dynamicCatalogProducts;
}

export async function addCatalogProducts(newProducts: ProductItem[]): Promise<void> {
  const current = getCatalogProducts();
  newProducts.forEach((np) => {
    const qty =
      typeof (np as any).stockQuantity === 'number'
        ? Math.max(0, Math.round((np as any).stockQuantity))
        : np.inStock
        ? 50
        : 0;
    const formatted = {
      ...np,
      imageUrl: np.image,
      fulfilmentType: np.category === 'Home & Kitchen' ? 'STANDARD_MARKETPLACE' : 'QUICK_COMMERCE',
      deliveryEta: '20-30 Mins',
      sku: `MBM-SKU-${np.id.toUpperCase()}`,
      inStock: qty > 0,
      stockQuantity: qty,
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
    await redisSet('catalog:custom_products', current).catch(() => {});
  }

  // 2. Persist to PostgreSQL permanent database
  try {
    const { prisma } = await import('./prisma');
    let defaultCat = await prisma.category.findFirst();
    if (!defaultCat) {
      defaultCat = await prisma.category.create({
        data: { name: 'Groceries', slug: 'groceries' },
      });
    }
    for (const np of newProducts) {
      const skuCode = `MBM-SKU-${np.id.toUpperCase()}`;
      const qty =
        typeof (np as any).stockQuantity === 'number'
          ? Math.max(0, Math.round((np as any).stockQuantity))
          : np.inStock
          ? 50
          : 0;
      await prisma.product.upsert({
        where: { sku: skuCode },
        update: {
          name: np.name,
          mrp: np.mrp,
          bachatPrice: np.bachatPrice,
          imageUrl: np.image,
          producerName: np.producerName || null,
          stockQuantity: qty,
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
          producerName: np.producerName || null,
          stockQuantity: qty,
          fulfilmentType: np.category === 'Home & Kitchen' ? 'STANDARD_MARKETPLACE' : 'QUICK_COMMERCE',
        },
      });
    }
  } catch (dbErr) {
    console.warn('PostgreSQL product catalog upsert deferred:', dbErr);
  }
}

export async function updateCatalogProductStock(productId: string, stockQuantity: number): Promise<any | null> {
  const qty = Math.max(0, Math.round(Number(stockQuantity) || 0));
  const current = getCatalogProducts();
  const cleanId = productId.toLowerCase();
  const target = current.find(
    (p) => p.id.toLowerCase() === cleanId || (p.sku && p.sku.toLowerCase() === cleanId)
  );

  if (target) {
    target.stockQuantity = qty;
    target.inStock = qty > 0;
  }

  if (isRedisConfigured()) {
    await redisSet('catalog:custom_products', current).catch(() => {});
  }

  try {
    const { prisma } = await import('./prisma');
    const skuCode = `MBM-SKU-${productId.toUpperCase()}`;
    await prisma.product.updateMany({
      where: {
        OR: [{ id: productId }, { sku: productId }, { sku: skuCode }],
      },
      data: { stockQuantity: qty },
    });
  } catch (dbErr) {
    console.warn('PostgreSQL stock update deferred:', dbErr);
  }

  return target || null;
}

// Backward compatible export
export const CATALOG_PRODUCTS = getCatalogProducts();
