import { sampleProducts } from '@/lib/data';
import { ProductItem } from '@/lib/types';

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
}

// Backward compatible export
export const CATALOG_PRODUCTS = getCatalogProducts();
