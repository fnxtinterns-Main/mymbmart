// MegaBachatMart — Inventory & SKU Management Store
// Version 1.0 | Store: Ranchi Central (MBM-RCH-01) | Multi-Store Ready
// Guiding principle: The stock ledger is the single source of truth. Stock levels are derived/materialized.

export interface SKUItem {
  id: string;
  skuCode: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  variantName: string;
  unitOfMeasure: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  hsnCode: string;
  isBatchTracked: boolean;
  isExpiryTracked: boolean;
  isReturnable: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'DISCONTINUED';
}

export interface StoreStockBucket {
  storeId: string;
  storeName: string;
  skuId: string;
  skuCode: string;
  productName: string;
  category: string;
  onHand: number;
  reservedSoft: number;
  reservedHard: number;
  damaged: number;
  quarantined: number;
  incoming: number;
  reorderPoint: number;
  reorderQty: number;
  updatedAt: string;
}

export interface BatchRecord {
  id: string;
  storeId: string;
  skuId: string;
  skuCode: string;
  productName: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  costPrice: number;
  receivedQty: number;
  remainingQty: number;
  grnId?: string;
  status: 'ACTIVE' | 'NEAR_EXPIRY' | 'CRITICAL' | 'EXPIRED' | 'QUARANTINED' | 'WRITTEN_OFF';
}

export interface StockReservation {
  id: string;
  storeId: string;
  skuId: string;
  skuCode: string;
  productName: string;
  orderId: string;
  orderNumber: string;
  quantity: number;
  reservationType: 'SOFT' | 'HARD';
  status: 'ACTIVE' | 'RELEASED' | 'CONSUMED';
  expiresAt: string; // for soft reservation TTL
  createdAt: string;
}

export interface StockLedgerEntry {
  id: string;
  storeId: string;
  skuId: string;
  skuCode: string;
  productName: string;
  batchId?: string;
  movementType: 'RECEIPT' | 'SALE' | 'RESERVE' | 'RELEASE' | 'ADJUST' | 'RETURN' | 'WRITEOFF';
  quantityDelta: number; // signed (+ / -)
  balanceAfter: number;
  referenceType: 'PO' | 'GRN' | 'ORDER' | 'ADJUSTMENT' | 'RETURN';
  referenceId: string;
  reasonCode?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  paymentTerms: string;
  leadTimeDays: number;
  suppliedCategories: string[];
  isActive: boolean;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CLOSED' | 'CANCELLED';
  expectedDate: string;
  items: {
    skuId: string;
    skuCode: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    unitCost: number;
  }[];
  totalAmount: number;
  createdAt: string;
}

const STORE_ID = 'MBM-RCH-01';
const STORE_NAME = 'Ranchi Central Dark Hub';

// Initial Genuine Inventory Setup
const INITIAL_SKUS: SKUItem[] = [
  {
    id: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    barcode: '8901030800014',
    productName: 'Aashirvaad Shudh Chakki Atta',
    brand: 'ITC Aashirvaad',
    category: 'Groceries',
    variantName: '5 kg Pack',
    unitOfMeasure: 'kg',
    mrp: 290,
    sellingPrice: 245,
    costPrice: 215,
    hsnCode: '11010000',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: false,
    status: 'ACTIVE',
  },
  {
    id: 'sku-2',
    skuCode: 'MB-GRO-FORT-1L',
    barcode: '8906007280021',
    productName: 'Fortune Kachi Ghani Mustard Oil',
    brand: 'Fortune',
    category: 'Groceries',
    variantName: '1 Litre Pouch',
    unitOfMeasure: 'L',
    mrp: 185,
    sellingPrice: 142,
    costPrice: 125,
    hsnCode: '15149100',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: false,
    status: 'ACTIVE',
  },
  {
    id: 'sku-3',
    skuCode: 'MB-SHG-MAHU-500',
    barcode: '8908009120038',
    productName: 'Pure Organic Mahua Honey',
    brand: 'Vanabandhu SHG',
    category: 'SHG Specials',
    variantName: '500g Jar',
    unitOfMeasure: 'g',
    mrp: 350,
    sellingPrice: 260,
    costPrice: 200,
    hsnCode: '04090000',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: true,
    status: 'ACTIVE',
  },
  {
    id: 'sku-4',
    skuCode: 'MB-BEV-TATA-250',
    barcode: '8901052001048',
    productName: 'Tata Tea Gold Leaf',
    brand: 'Tata Consumer',
    category: 'Daily Essentials',
    variantName: '250g Pouch',
    unitOfMeasure: 'g',
    mrp: 175,
    sellingPrice: 140,
    costPrice: 120,
    hsnCode: '09024020',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: false,
    status: 'ACTIVE',
  },
  {
    id: 'sku-5',
    skuCode: 'MB-HOU-SURF-1K',
    barcode: '8901030780055',
    productName: 'Surf Excel Quick Wash Detergent Powder',
    brand: 'Hindustan Unilever',
    category: 'Daily Essentials',
    variantName: '1 kg Box',
    unitOfMeasure: 'kg',
    mrp: 230,
    sellingPrice: 185,
    costPrice: 155,
    hsnCode: '34022010',
    isBatchTracked: false,
    isExpiryTracked: false,
    isReturnable: true,
    status: 'ACTIVE',
  },
  {
    id: 'sku-6',
    skuCode: 'MB-DAI-AMUL-500',
    barcode: '8901262010062',
    productName: 'Amul Taaza Homogenised Toned Milk',
    brand: 'Amul GCMMF',
    category: 'Daily Essentials',
    variantName: '500 ml Tetra Pack',
    unitOfMeasure: 'ml',
    mrp: 35,
    sellingPrice: 32,
    costPrice: 28,
    hsnCode: '04012000',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: false,
    status: 'ACTIVE',
  },
  {
    id: 'sku-7',
    skuCode: 'MB-SHG-JHRI-1K',
    barcode: '8908009120076',
    productName: 'Indigenous Unpolished Red Rice',
    brand: 'Jharkhand Mahila Samakhya',
    category: 'SHG Specials',
    variantName: '1 kg Eco Bag',
    unitOfMeasure: 'kg',
    mrp: 140,
    sellingPrice: 110,
    costPrice: 85,
    hsnCode: '10063010',
    isBatchTracked: true,
    isExpiryTracked: true,
    isReturnable: true,
    status: 'ACTIVE',
  }
];

const INITIAL_STOCK_BUCKETS: StoreStockBucket[] = [
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    category: 'Groceries',
    onHand: 120,
    reservedSoft: 4,
    reservedHard: 8,
    damaged: 1,
    quarantined: 0,
    incoming: 50,
    reorderPoint: 25,
    reorderQty: 100,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-2',
    skuCode: 'MB-GRO-FORT-1L',
    productName: 'Fortune Kachi Ghani Mustard Oil 1L',
    category: 'Groceries',
    onHand: 85,
    reservedSoft: 2,
    reservedHard: 6,
    damaged: 0,
    quarantined: 0,
    incoming: 40,
    reorderPoint: 20,
    reorderQty: 60,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-3',
    skuCode: 'MB-SHG-MAHU-500',
    productName: 'Pure Organic Mahua Honey 500g',
    category: 'SHG Specials',
    onHand: 42,
    reservedSoft: 1,
    reservedHard: 3,
    damaged: 0,
    quarantined: 0,
    incoming: 30,
    reorderPoint: 15,
    reorderQty: 50,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-4',
    skuCode: 'MB-BEV-TATA-250',
    productName: 'Tata Tea Gold Leaf 250g',
    category: 'Daily Essentials',
    onHand: 18,
    reservedSoft: 2,
    reservedHard: 4,
    damaged: 0,
    quarantined: 0,
    incoming: 40,
    reorderPoint: 25, // currently below ROP -> triggers alert
    reorderQty: 60,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-5',
    skuCode: 'MB-HOU-SURF-1K',
    productName: 'Surf Excel Quick Wash 1kg',
    category: 'Daily Essentials',
    onHand: 64,
    reservedSoft: 0,
    reservedHard: 2,
    damaged: 1,
    quarantined: 0,
    incoming: 0,
    reorderPoint: 15,
    reorderQty: 40,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-6',
    skuCode: 'MB-DAI-AMUL-500',
    productName: 'Amul Taaza Homogenised Toned Milk 500ml',
    category: 'Daily Essentials',
    onHand: 55,
    reservedSoft: 5,
    reservedHard: 10,
    damaged: 0,
    quarantined: 2,
    incoming: 60,
    reorderPoint: 30,
    reorderQty: 100,
    updatedAt: new Date().toISOString(),
  },
  {
    storeId: STORE_ID,
    storeName: STORE_NAME,
    skuId: 'sku-7',
    skuCode: 'MB-SHG-JHRI-1K',
    productName: 'Indigenous Unpolished Red Rice 1kg',
    category: 'SHG Specials',
    onHand: 9,
    reservedSoft: 1,
    reservedHard: 2,
    damaged: 0,
    quarantined: 0,
    incoming: 25,
    reorderPoint: 15, // below ROP -> low stock trigger
    reorderQty: 40,
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_BATCHES: BatchRecord[] = [
  {
    id: 'batch-101',
    storeId: STORE_ID,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    batchNumber: 'B-ASH-2026-09A',
    manufactureDate: '2026-09-01',
    expiryDate: '2027-03-01', // ~105 days
    costPrice: 215,
    receivedQty: 80,
    remainingQty: 50,
    status: 'ACTIVE',
  },
  {
    id: 'batch-102',
    storeId: STORE_ID,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    batchNumber: 'B-ASH-2026-10B',
    manufactureDate: '2026-10-15',
    expiryDate: '2027-04-15',
    costPrice: 215,
    receivedQty: 70,
    remainingQty: 70,
    status: 'ACTIVE',
  },
  {
    id: 'batch-103',
    storeId: STORE_ID,
    skuId: 'sku-6',
    skuCode: 'MB-DAI-AMUL-500',
    productName: 'Amul Taaza Milk 500ml',
    batchNumber: 'B-AML-2026-11X',
    manufactureDate: '2026-11-10',
    expiryDate: '2026-11-25', // 9 days to expiry -> Warning/Critical
    costPrice: 28,
    receivedQty: 60,
    remainingQty: 25,
    status: 'CRITICAL',
  },
  {
    id: 'batch-104',
    storeId: STORE_ID,
    skuId: 'sku-4',
    skuCode: 'MB-BEV-TATA-250',
    productName: 'Tata Tea Gold Leaf 250g',
    batchNumber: 'B-TAT-2026-07K',
    manufactureDate: '2026-07-01',
    expiryDate: '2026-12-10', // 24 days -> Near Expiry Warning
    costPrice: 120,
    receivedQty: 50,
    remainingQty: 18,
    status: 'NEAR_EXPIRY',
  }
];

const INITIAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-1',
    name: 'ITC Foods Logistics Ltd.',
    contactPerson: 'Manoj Verma',
    phone: '+91 98351 22910',
    email: 'mverma@itc-distrib.com',
    gstin: '20AAACI1681G1Z2',
    paymentTerms: 'Net 15',
    leadTimeDays: 2,
    suppliedCategories: ['Groceries', 'Daily Essentials'],
    isActive: true,
  },
  {
    id: 'sup-2',
    name: 'Adani Wilmar Direct Depo',
    contactPerson: 'Amit Sinha',
    phone: '+91 94311 88421',
    email: 'ranchi.depo@adaniwilmar.in',
    gstin: '20AABCA0558L1ZN',
    paymentTerms: 'Net 7',
    leadTimeDays: 1,
    suppliedCategories: ['Groceries'],
    isActive: true,
  },
  {
    id: 'sup-3',
    name: 'Vanabandhu Tribal Producer Co-op',
    contactPerson: 'Sunita Soren',
    phone: '+91 97092 11456',
    email: 'vanabandhu.shg@gmail.com',
    gstin: '20AACCV4129P1ZK',
    paymentTerms: 'Immediate / Weekly Direct Transfer',
    leadTimeDays: 3,
    suppliedCategories: ['SHG Specials'],
    isActive: true,
  }
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'po-1001',
    poNumber: 'PO-2026-RCH-089',
    storeId: STORE_ID,
    supplierId: 'sup-1',
    supplierName: 'ITC Foods Logistics Ltd.',
    status: 'ACKNOWLEDGED',
    expectedDate: '2026-11-18',
    items: [
      {
        skuId: 'sku-1',
        skuCode: 'MB-GRO-AASH-5K',
        productName: 'Aashirvaad Shudh Chakki Atta 5kg',
        orderedQty: 50,
        receivedQty: 0,
        unitCost: 215,
      }
    ],
    totalAmount: 10750,
    createdAt: '2026-11-15T11:00:00Z',
  },
  {
    id: 'po-1002',
    poNumber: 'PO-2026-RCH-090',
    storeId: STORE_ID,
    supplierId: 'sup-3',
    supplierName: 'Vanabandhu Tribal Producer Co-op',
    status: 'SENT',
    expectedDate: '2026-11-19',
    items: [
      {
        skuId: 'sku-3',
        skuCode: 'MB-SHG-MAHU-500',
        productName: 'Pure Organic Mahua Honey 500g',
        orderedQty: 30,
        receivedQty: 0,
        unitCost: 200,
      }
    ],
    totalAmount: 6000,
    createdAt: '2026-11-16T09:30:00Z',
  }
];

const INITIAL_LEDGER: StockLedgerEntry[] = [
  {
    id: 'led-1',
    storeId: STORE_ID,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    batchId: 'batch-102',
    movementType: 'RECEIPT',
    quantityDelta: 70,
    balanceAfter: 120,
    referenceType: 'GRN',
    referenceId: 'GRN-2026-041',
    createdBy: 'Store Manager (Rajesh Kumar)',
    createdAt: '2026-11-14T10:15:00Z',
    notes: 'Inward receipt against PO-2026-RCH-082',
  },
  {
    id: 'led-2',
    storeId: STORE_ID,
    skuId: 'sku-2',
    skuCode: 'MB-GRO-FORT-1L',
    productName: 'Fortune Mustard Oil 1L',
    movementType: 'SALE',
    quantityDelta: -2,
    balanceAfter: 85,
    referenceType: 'ORDER',
    referenceId: 'MBM-2026-10492',
    createdBy: 'System (Order Fulfilled)',
    createdAt: '2026-11-16T11:20:00Z',
  },
  {
    id: 'led-3',
    storeId: STORE_ID,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    movementType: 'ADJUST',
    quantityDelta: -1,
    balanceAfter: 120,
    referenceType: 'ADJUSTMENT',
    referenceId: 'ADJ-2026-012',
    reasonCode: 'DAMAGE',
    notes: 'Outer packaging burst during dark store forklift movement',
    createdBy: 'Warehouse Lead (Anil Oraon)',
    createdAt: '2026-11-15T16:45:00Z',
  }
];

const INITIAL_RESERVATIONS: StockReservation[] = [
  {
    id: 'res-1',
    storeId: STORE_ID,
    skuId: 'sku-1',
    skuCode: 'MB-GRO-AASH-5K',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    orderId: 'ord-101',
    orderNumber: 'MBM-2026-9021',
    quantity: 2,
    reservationType: 'HARD',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'res-2',
    storeId: STORE_ID,
    skuId: 'sku-6',
    skuCode: 'MB-DAI-AMUL-500',
    productName: 'Amul Taaza Milk 500ml',
    orderId: 'ord-102',
    orderNumber: 'MBM-2026-9028',
    quantity: 3,
    reservationType: 'SOFT',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 12 * 60000).toISOString(), // 12 mins left on TTL
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  }
];

// In-Memory Global Singleton State
interface InventoryGlobalState {
  skus: SKUItem[];
  stockBuckets: StoreStockBucket[];
  batches: BatchRecord[];
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  stockLedger: StockLedgerEntry[];
  reservations: StockReservation[];
}

const globalForInventory = globalThis as unknown as {
  inventoryStoreInstance?: InventoryGlobalState;
};

if (!globalForInventory.inventoryStoreInstance) {
  globalForInventory.inventoryStoreInstance = {
    skus: INITIAL_SKUS,
    stockBuckets: INITIAL_STOCK_BUCKETS,
    batches: INITIAL_BATCHES,
    suppliers: INITIAL_SUPPLIERS,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    stockLedger: INITIAL_LEDGER,
    reservations: INITIAL_RESERVATIONS,
  };
}

export const inventoryStore = globalForInventory.inventoryStoreInstance;

// Helper: Calculate Available Stock for a SKU at Store
export function getAvailableStock(skuCode: string, storeId = STORE_ID): number {
  const bucket = inventoryStore.stockBuckets.find(
    (b) => b.skuCode === skuCode && b.storeId === storeId
  );
  if (!bucket) return 0;
  return Math.max(0, bucket.onHand - (bucket.reservedSoft + bucket.reservedHard));
}

// Atomic Reservation Function (Hybrid Soft/Hard)
export function createStockReservation(params: {
  skuCode: string;
  orderId: string;
  orderNumber: string;
  quantity: number;
  reservationType: 'SOFT' | 'HARD';
  ttlMinutes?: number;
  storeId?: string;
}): { success: boolean; message: string; reservation?: StockReservation } {
  const storeId = params.storeId || STORE_ID;
  const bucket = inventoryStore.stockBuckets.find(
    (b) => b.skuCode === params.skuCode && b.storeId === storeId
  );
  if (!bucket) {
    return { success: false, message: `SKU ${params.skuCode} not found in store stock.` };
  }

  const available = bucket.onHand - (bucket.reservedSoft + bucket.reservedHard);
  if (available < params.quantity) {
    return {
      success: false,
      message: `Insufficient stock for ${bucket.productName}. Available: ${available}, Requested: ${params.quantity}`,
    };
  }

  // Update bucket
  if (params.reservationType === 'SOFT') {
    bucket.reservedSoft += params.quantity;
  } else {
    bucket.reservedHard += params.quantity;
  }
  bucket.updatedAt = new Date().toISOString();

  const ttl = params.ttlMinutes || (params.reservationType === 'SOFT' ? 15 : 60);
  const newReservation: StockReservation = {
    id: 'res-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    storeId,
    skuId: bucket.skuId,
    skuCode: bucket.skuCode,
    productName: bucket.productName,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    quantity: params.quantity,
    reservationType: params.reservationType,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + ttl * 60000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  inventoryStore.reservations.unshift(newReservation);
  return { success: true, message: 'Stock reserved successfully.', reservation: newReservation };
}

// Atomic reservation alias for routing engine
export function atomicReserveStock(params: {
  skuId: string;
  skuCode?: string;
  quantity: number;
  orderId: string;
  orderNumber: string;
  ttlMinutes?: number;
  storeId?: string;
}): { success: boolean; message: string; reservation?: StockReservation } {
  const bucket = inventoryStore.stockBuckets.find(
    (b) => b.skuId === params.skuId || b.skuCode === params.skuCode || b.skuCode === params.skuId
  );
  if (!bucket) {
    return { success: false, message: `SKU ${params.skuId} not found` };
  }
  return createStockReservation({
    skuCode: bucket.skuCode,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    quantity: params.quantity,
    reservationType: 'SOFT',
    ttlMinutes: params.ttlMinutes,
    storeId: params.storeId || bucket.storeId,
  });
}

// Release reservation function
export function releaseStockReservation(reservationId: string, _reason?: string): boolean {
  const res = inventoryStore.reservations.find(r => r.id === reservationId);
  if (!res || res.status !== 'ACTIVE') return false;
  res.status = 'RELEASED';
  const bucket = inventoryStore.stockBuckets.find(b => b.skuId === res.skuId && b.storeId === res.storeId);
  if (bucket) {
    if (res.reservationType === 'SOFT') {
      bucket.reservedSoft = Math.max(0, bucket.reservedSoft - res.quantity);
    } else {
      bucket.reservedHard = Math.max(0, bucket.reservedHard - res.quantity);
    }
    bucket.updatedAt = new Date().toISOString();
  }
  return true;
}

// Stock Adjustment with Immutable Ledger Entry
export function adjustStock(params: {
  skuCode: string;
  quantityDelta: number; // positive or negative
  reasonCode: 'DAMAGE' | 'THEFT' | 'COUNT_CORRECTION' | 'EXPIRY_WRITEOFF' | 'RETURN_TO_SUPPLIER' | 'CUSTOMER_RETURN_RESTOCK' | 'SAMPLE_PROMO' | 'SYSTEM_CORRECTION';
  notes?: string;
  createdBy: string;
  storeId?: string;
}): { success: boolean; message: string; balanceAfter?: number } {
  const storeId = params.storeId || STORE_ID;
  const bucket = inventoryStore.stockBuckets.find(
    (b) => b.skuCode === params.skuCode && b.storeId === storeId
  );
  if (!bucket) {
    return { success: false, message: 'SKU not found in store stock.' };
  }

  if (bucket.onHand + params.quantityDelta < 0) {
    return {
      success: false,
      message: `Negative stock prevented. Current On-hand: ${bucket.onHand}, Delta: ${params.quantityDelta}`,
    };
  }

  bucket.onHand += params.quantityDelta;
  if (params.reasonCode === 'DAMAGE') {
    bucket.damaged += Math.abs(params.quantityDelta);
  }
  bucket.updatedAt = new Date().toISOString();

  // Create immutable ledger entry
  const ledgerEntry: StockLedgerEntry = {
    id: 'led-' + Date.now(),
    storeId,
    skuId: bucket.skuId,
    skuCode: bucket.skuCode,
    productName: bucket.productName,
    movementType: 'ADJUST',
    quantityDelta: params.quantityDelta,
    balanceAfter: bucket.onHand,
    referenceType: 'ADJUSTMENT',
    referenceId: 'ADJ-' + Date.now().toString().slice(-6),
    reasonCode: params.reasonCode,
    notes: params.notes,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString(),
  };

  inventoryStore.stockLedger.unshift(ledgerEntry);
  return { success: true, message: 'Stock adjusted and ledger posted.', balanceAfter: bucket.onHand };
}

// Post GRN (Goods Receipt Note) Inward Stock
export function postGoodsReceipt(params: {
  poNumber: string;
  skuCode: string;
  receivedQty: number;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  costPrice: number;
  receivedBy: string;
  storeId?: string;
}): { success: boolean; message: string; grnNumber?: string } {
  const storeId = params.storeId || STORE_ID;
  const bucket = inventoryStore.stockBuckets.find(
    (b) => b.skuCode === params.skuCode && b.storeId === storeId
  );
  if (!bucket) {
    return { success: false, message: 'SKU bucket not found.' };
  }

  // 1. Increase On-hand, reduce Incoming
  bucket.onHand += params.receivedQty;
  bucket.incoming = Math.max(0, bucket.incoming - params.receivedQty);
  bucket.updatedAt = new Date().toISOString();

  const grnNumber = 'GRN-2026-' + Math.floor(1000 + Math.random() * 9000);

  // 2. Create Batch Record
  const newBatch: BatchRecord = {
    id: 'batch-' + Date.now(),
    storeId,
    skuId: bucket.skuId,
    skuCode: bucket.skuCode,
    productName: bucket.productName,
    batchNumber: params.batchNumber,
    manufactureDate: params.manufactureDate,
    expiryDate: params.expiryDate,
    costPrice: params.costPrice,
    receivedQty: params.receivedQty,
    remainingQty: params.receivedQty,
    grnId: grnNumber,
    status: 'ACTIVE',
  };
  inventoryStore.batches.unshift(newBatch);

  // 3. Post to Immutable Ledger
  const ledgerEntry: StockLedgerEntry = {
    id: 'led-' + Date.now(),
    storeId,
    skuId: bucket.skuId,
    skuCode: bucket.skuCode,
    productName: bucket.productName,
    batchId: newBatch.id,
    movementType: 'RECEIPT',
    quantityDelta: params.receivedQty,
    balanceAfter: bucket.onHand,
    referenceType: 'GRN',
    referenceId: grnNumber,
    notes: `Inward receipt against ${params.poNumber} (Batch ${params.batchNumber})`,
    createdBy: params.receivedBy,
    createdAt: new Date().toISOString(),
  };
  inventoryStore.stockLedger.unshift(ledgerEntry);

  return { success: true, message: 'GRN posted and stock added.', grnNumber };
}

// PostgreSQL Atomic Inventory Reservation using Conditional Update (Row-Level Locking Protection)
export async function atomicReserveStoreInventory(params: {
  storeId: string;
  productId: string;
  quantity: number;
}): Promise<{ success: boolean; message: string; reservedQty?: number }> {
  // Input validation: quantity must strictly be a positive integer
  if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
    return { success: false, message: 'Reservation quantity must be a positive integer.' };
  }

  // 1. Production Mode: PostgreSQL is mandatory. No silent in-memory fallback.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production. Database connection is mandatory.');
    }
    try {
      const { prisma } = await import('./prisma');
      if (!prisma) {
        return { success: false, message: 'Production database client unavailable.' };
      }
      // Single atomic conditional update: locks row and re-evaluates capacity
      const result: any[] = await prisma.$queryRawUnsafe(
        `UPDATE "StoreInventory"
         SET "quantityReserved" = "quantityReserved" + $1,
             "updatedAt" = NOW()
         WHERE "storeId" = $2
           AND "productId" = $3
           AND ("quantityAvailable" - "quantityReserved") >= $1
         RETURNING "storeId", "productId", "quantityReserved", "quantityAvailable";`,
        params.quantity,
        params.storeId,
        params.productId
      );
      if (Array.isArray(result) && result.length > 0) {
        return { success: true, message: 'Stock reserved atomically in PostgreSQL.', reservedQty: result[0].quantityReserved };
      }
      return { success: false, message: 'Insufficient available inventory in PostgreSQL store.' };
    } catch (err: any) {
      // In production, database errors MUST fail the reservation to prevent unpersisted orders
      return { success: false, message: `Database transaction failed during atomic reservation: ${err.message}` };
    }
  }

  // 2. Test / Development Mode Fallback
  const bucket = inventoryStore.stockBuckets.find(
    (b) => (b.skuId === params.productId || b.skuCode === params.productId) && b.storeId === params.storeId
  );
  if (!bucket) {
    return { success: false, message: `SKU ${params.productId} not found in store.` };
  }
  const available = bucket.onHand - (bucket.reservedSoft + bucket.reservedHard);
  if (available < params.quantity) {
    return { success: false, message: `Insufficient stock. Available: ${available}, Requested: ${params.quantity}` };
  }
  bucket.reservedSoft += params.quantity;
  return { success: true, message: 'Stock reserved in development/test store.', reservedQty: bucket.reservedSoft };
}
