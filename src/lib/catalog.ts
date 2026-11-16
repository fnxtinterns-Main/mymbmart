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
  {
    id: 'p-9',
    name: 'Smart Bluetooth Fitness Watch (Waterproof)',
    category: 'Home & Kitchen' as const,
    unit: '1 Unit',
    mrp: 2999,
    bachatPrice: 1499,
    discountPercent: 50,
    cashbackAmount: 75,
    referralRewardAmount: 45,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    isSHG: false,
    inStock: true,
    fulfilmentType: 'STANDARD_MARKETPLACE',
    deliveryEta: '2-4 Days',
    sku: 'MBM-SKU-P9',
    stockQuantity: 30,
    cashbackPct: 5,
    referralPct: 3,
  },
  {
    id: 'p-10',
    name: 'Organic Wild Forest Raw Honey',
    category: 'SHG Specials' as const,
    unit: '500 g',
    mrp: 380,
    bachatPrice: 290,
    discountPercent: 24,
    cashbackAmount: 20,
    referralRewardAmount: 12,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
    isSHG: true,
    producerName: 'Vanabandhu Tribal Producer Co., Khunti',
    inStock: true,
    fulfilmentType: 'QUICK_COMMERCE',
    deliveryEta: '20-30 Mins',
    sku: 'MBM-SKU-P10',
    stockQuantity: 45,
    cashbackPct: 7,
    referralPct: 4,
  },
  {
    id: 'p-11',
    name: 'Farm Fresh Cow Milk (Pasteurized Whole Milk)',
    category: 'Daily Essentials' as const,
    unit: '1 Litre',
    mrp: 66,
    bachatPrice: 58,
    discountPercent: 12,
    cashbackAmount: 4,
    referralRewardAmount: 2,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
    isSHG: false,
    inStock: true,
    fulfilmentType: 'QUICK_COMMERCE',
    deliveryEta: '15-20 Mins',
    sku: 'MBM-SKU-P11',
    stockQuantity: 100,
    cashbackPct: 7,
    referralPct: 3,
  }
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
