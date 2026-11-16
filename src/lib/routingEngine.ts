// MegaBachatMart — Hyperlocal Routing Engine
// Version 1.0 | Core Hyperlocal Marketplace Fulfilment Engine
// Implements deterministic hard filters (F1–F11), weighted scoring, atomic reservation,
// anti-starvation fairness, fallback re-routing, and full audit logging.

import { atomicReserveStock, releaseStockReservation } from './inventoryStore';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface OperatingHours {
  open: string;  // e.g. "08:00"
  close: string; // e.g. "22:00"
}

export interface CandidateShop {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  geo: GeoCoordinate;
  deliveryRadiusKm: number;
  operatingHours: { [day: string]: OperatingHours };
  holidays: string[]; // YYYY-MM-DD
  deliveryCapability: 'OWN_RIDER' | 'PLATFORM_RIDER' | 'PICKUP_ONLY';
  capacityPerDay: number;
  ordersToday: number;
  pendingAcceptance: number;
  pickingCount: number;
  trustScore: number;       // 0 to 5
  ratingAvg: number;        // 1 to 5
  acceptanceRate30d: number; // 0 to 1
  onTimeRate30d: number;     // 0 to 1
  serviceablePincodes: string[];
  hostedSellerIds?: string[]; // IDs of SHG producers hosted at this hub
  lastOrderAt?: string;
  createdAt: string;
}

export interface ShopItemListing {
  shopId: string;
  skuId: string;
  skuCode: string;
  productName: string;
  price: number;
  stockOnHand: number;
  stockReserved: number;
  status: 'LIVE' | 'PAUSED' | 'DISCONTINUED';
  hasValidBatch: boolean; // FEFO compliant batch exists with safe expiry
}

export interface OrderItemRequest {
  skuId: string;
  skuCode?: string;
  quantity: number;
  sellerId?: string | null;
}

export interface RoutingOrderContext {
  orderId: string;
  customerId: string;
  fulfilmentType: 'DELIVERY' | 'PICKUP';
  deliveryPincode: string;
  deliveryLat?: number;
  deliveryLng?: number;
  pickupPreferredShopId?: string;
  customerSelectedShopId?: string | null;
  items: OrderItemRequest[];
  requestedAt?: string;
  excludedShopIds?: string[];
  attemptNumber?: number;
}

export interface RoutingConfig {
  weights: {
    distance: number;
    rating: number;
    acceptance: number;
    ontime: number;
    load: number;
    price: number;
    trust: number;
    fairness: number;
  };
  acceptanceSlaMinutes: number;
  pickingSlaMinutes: number;
  softReservationTtlOnlineMin: number;
  softReservationTtlPayStoreMin: number;
  maxRerouteAttempts: number;
  closingBufferMinutes: number;
  antiStarvationDays: number;
  antiStarvationBonus: number;
  newShopBoostDays: number;
  newShopBoostBonus: number;
  highLoadThreshold: number;
}

export interface FilterExclusion {
  shopId: string;
  shopName: string;
  filterCode: 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11';
  reason: string;
}

export interface ScoredCandidate {
  shopId: string;
  shopName: string;
  distanceKm: number;
  totalPrice: number;
  score: number;
  factors: {
    distance: number;
    rating: number;
    acceptance: number;
    ontime: number;
    load: number;
    price: number;
    trust: number;
    fairness: number;
  };
  bonusApplied: {
    antiStarvation: boolean;
    newShopBoost: boolean;
  };
  estimatedDeliveryMinutes: number;
}

export interface RoutingResult {
  success: boolean;
  orderId: string;
  attemptNumber: number;
  selectedShopId?: string;
  selectedShopName?: string;
  reservationIds?: string[];
  estimatedDeliveryMinutes?: number;
  routingAuditId: string;
  candidateCount: number;
  scoredCount: number;
  winningScore?: number;
  latencyMs: number;
  error?: string;
  excludedShops: FilterExclusion[];
  scoredShops: ScoredCandidate[];
}

export interface RoutingAuditLogEntry {
  id: string;
  orderId: string;
  attemptNumber: number;
  pincode: string;
  fulfilmentType: 'DELIVERY' | 'PICKUP';
  candidateCount: number;
  excludedShops: FilterExclusion[];
  scoredShops: ScoredCandidate[];
  selectedShopId?: string;
  selectedShopName?: string;
  selectionReason: string;
  reservationIds?: string[];
  latencyMs: number;
  createdAt: string;
}

// ----------------------------------------------------
// DEFAULT ROUTING CONFIGURATION (Phase 1)
// ----------------------------------------------------
export const defaultRoutingConfig: RoutingConfig = {
  weights: {
    distance: 0.25,
    rating: 0.15,
    acceptance: 0.15,
    ontime: 0.10,
    load: 0.10,
    price: 0.10,
    trust: 0.05,
    fairness: 0.10,
  },
  acceptanceSlaMinutes: 5,
  pickingSlaMinutes: 15,
  softReservationTtlOnlineMin: 15,
  softReservationTtlPayStoreMin: 30,
  maxRerouteAttempts: 3,
  closingBufferMinutes: 15,
  antiStarvationDays: 7,
  antiStarvationBonus: 0.05,
  newShopBoostDays: 30,
  newShopBoostBonus: 0.03,
  highLoadThreshold: 0.80,
};

// In-memory config state (admin-tunable)
let currentRoutingConfig: RoutingConfig = { ...defaultRoutingConfig };
let routingConfigHistory: Array<{ timestamp: string; config: RoutingConfig; changedBy: string }> = [
  { timestamp: new Date().toISOString(), config: { ...defaultRoutingConfig }, changedBy: 'System Init' }
];

// ----------------------------------------------------
// SEED CANDIDATE SHOPS (Ranchi Hyperlocal Network)
// ----------------------------------------------------
export const registeredCandidateShops: CandidateShop[] = [
  {
    id: 'shop-rch-01',
    name: 'Sharma Kirana Store',
    code: 'MBM-RCH-SHARMA',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    geo: { lat: 23.3441, lng: 85.3096 }, // Main Road / Ranchi Central
    deliveryRadiusKm: 5.5,
    operatingHours: {
      all: { open: '07:30', close: '22:30' }
    },
    holidays: [],
    deliveryCapability: 'OWN_RIDER',
    capacityPerDay: 120,
    ordersToday: 42,
    pendingAcceptance: 1,
    pickingCount: 2,
    trustScore: 4.8,
    ratingAvg: 4.6,
    acceptanceRate30d: 0.96,
    onTimeRate30d: 0.94,
    serviceablePincodes: ['834001', '834002', '834008', '834005'],
    hostedSellerIds: ['seller-shg-01', 'seller-shg-02'],
    lastOrderAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'shop-rch-02',
    name: 'Gupta Super Grocery Mart',
    code: 'MBM-RCH-GUPTA',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    geo: { lat: 23.3550, lng: 85.3180 }, // Harmu Housing Colony
    deliveryRadiusKm: 6.0,
    operatingHours: {
      all: { open: '08:00', close: '22:00' }
    },
    holidays: [],
    deliveryCapability: 'PLATFORM_RIDER',
    capacityPerDay: 100,
    ordersToday: 28,
    pendingAcceptance: 0,
    pickingCount: 1,
    trustScore: 4.4,
    ratingAvg: 4.3,
    acceptanceRate30d: 0.91,
    onTimeRate30d: 0.89,
    serviceablePincodes: ['834001', '834002', '834004', '834012'],
    hostedSellerIds: ['seller-shg-03'],
    lastOrderAt: new Date(Date.now() - 3600000 * 36).toISOString(), // 36h ago (1.5 days)
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'shop-rch-03',
    name: 'Verma Daily Mart & Bachat Kendra',
    code: 'MBM-RCH-VERMA',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    geo: { lat: 23.3320, lng: 85.3250 }, // Doranda Bazar
    deliveryRadiusKm: 4.5,
    operatingHours: {
      all: { open: '08:30', close: '21:30' }
    },
    holidays: [],
    deliveryCapability: 'OWN_RIDER',
    capacityPerDay: 90,
    ordersToday: 65,
    pendingAcceptance: 2,
    pickingCount: 3,
    trustScore: 4.7,
    ratingAvg: 4.8,
    acceptanceRate30d: 0.88,
    onTimeRate30d: 0.85,
    serviceablePincodes: ['834001', '834002', '834003'],
    hostedSellerIds: [],
    lastOrderAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: '2025-06-20T00:00:00Z',
  },
  {
    id: 'shop-rch-04',
    name: 'Jharkhand Mahila SHG Producer Hub',
    code: 'MBM-RCH-SHG-HUB',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    geo: { lat: 23.3750, lng: 85.3120 }, // Kanke Road
    deliveryRadiusKm: 7.0,
    operatingHours: {
      all: { open: '09:00', close: '20:00' }
    },
    holidays: [],
    deliveryCapability: 'OWN_RIDER',
    capacityPerDay: 80,
    ordersToday: 12,
    pendingAcceptance: 0,
    pickingCount: 0,
    trustScore: 4.9,
    ratingAvg: 4.9,
    acceptanceRate30d: 0.98,
    onTimeRate30d: 0.95,
    serviceablePincodes: ['834001', '834006', '834008'],
    hostedSellerIds: ['seller-shg-01', 'seller-shg-02', 'seller-shg-03', 'seller-shg-04'],
    lastOrderAt: new Date(Date.now() - 3600000 * 200).toISOString(), // > 8 days ago (Anti-starvation eligible!)
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'shop-rch-05',
    name: 'Ranchi Central Fulfilment Hub (MBM Dark Store)',
    code: 'MBM-RCH-01',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    geo: { lat: 23.3600, lng: 85.3300 }, // Lalpur Chowk
    deliveryRadiusKm: 8.0,
    operatingHours: {
      all: { open: '06:00', close: '23:59' }
    },
    holidays: [],
    deliveryCapability: 'PLATFORM_RIDER',
    capacityPerDay: 300,
    ordersToday: 110,
    pendingAcceptance: 1,
    pickingCount: 4,
    trustScore: 4.9,
    ratingAvg: 4.7,
    acceptanceRate30d: 0.99,
    onTimeRate30d: 0.97,
    serviceablePincodes: ['834001', '834002', '834003', '834004', '834005', '834006', '834008'],
    hostedSellerIds: ['seller-shg-01', 'seller-shg-02'],
    lastOrderAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: '2024-10-01T00:00:00Z',
  }
];

// ----------------------------------------------------
// SEED SHOP LISTINGS (Catalog pricing & on-hand inventory)
// ----------------------------------------------------
export const registeredShopListings: ShopItemListing[] = [
  // Sharma Kirana
  { shopId: 'shop-rch-01', skuId: 'MB-GRO-AASH-5K', skuCode: 'MB-GRO-AASH-5K', productName: 'Aashirvaad Shudh Chakki Atta 5kg', price: 245, stockOnHand: 45, stockReserved: 2, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-01', skuId: 'MB-GRO-FORT-1L', skuCode: 'MB-GRO-FORT-1L', productName: 'Fortune Premium Kachi Ghani Mustard Oil 1L', price: 155, stockOnHand: 30, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-01', skuId: 'MB-SHG-AMLA-500G', skuCode: 'MB-SHG-AMLA-500G', productName: 'Organic Amla & Mango Murabba 500g', price: 175, stockOnHand: 18, stockReserved: 1, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-01', skuId: 'MB-DAL-TOOR-1K', skuCode: 'MB-DAL-TOOR-1K', productName: 'Tata Sampann Unpolished Toor Dal 1kg', price: 180, stockOnHand: 25, stockReserved: 0, status: 'LIVE', hasValidBatch: true },

  // Gupta Super Grocery
  { shopId: 'shop-rch-02', skuId: 'MB-GRO-AASH-5K', skuCode: 'MB-GRO-AASH-5K', productName: 'Aashirvaad Shudh Chakki Atta 5kg', price: 242, stockOnHand: 20, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-02', skuId: 'MB-GRO-FORT-1L', skuCode: 'MB-GRO-FORT-1L', productName: 'Fortune Premium Kachi Ghani Mustard Oil 1L', price: 152, stockOnHand: 15, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-02', skuId: 'MB-DAL-TOOR-1K', skuCode: 'MB-DAL-TOOR-1K', productName: 'Tata Sampann Unpolished Toor Dal 1kg', price: 178, stockOnHand: 12, stockReserved: 0, status: 'LIVE', hasValidBatch: true },

  // Verma Daily Mart
  { shopId: 'shop-rch-03', skuId: 'MB-GRO-AASH-5K', skuCode: 'MB-GRO-AASH-5K', productName: 'Aashirvaad Shudh Chakki Atta 5kg', price: 248, stockOnHand: 15, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-03', skuId: 'MB-GRO-FORT-1L', skuCode: 'MB-GRO-FORT-1L', productName: 'Fortune Premium Kachi Ghani Mustard Oil 1L', price: 158, stockOnHand: 8, stockReserved: 0, status: 'LIVE', hasValidBatch: true },

  // Jharkhand Mahila SHG Producer Hub
  { shopId: 'shop-rch-04', skuId: 'MB-SHG-AMLA-500G', skuCode: 'MB-SHG-AMLA-500G', productName: 'Organic Amla & Mango Murabba 500g', price: 165, stockOnHand: 60, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-04', skuId: 'MB-GRO-FORT-1L', skuCode: 'MB-GRO-FORT-1L', productName: 'Fortune Premium Kachi Ghani Mustard Oil 1L', price: 160, stockOnHand: 20, stockReserved: 0, status: 'LIVE', hasValidBatch: true },

  // Ranchi Central Dark Store
  { shopId: 'shop-rch-05', skuId: 'MB-GRO-AASH-5K', skuCode: 'MB-GRO-AASH-5K', productName: 'Aashirvaad Shudh Chakki Atta 5kg', price: 240, stockOnHand: 120, stockReserved: 5, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-05', skuId: 'MB-GRO-FORT-1L', skuCode: 'MB-GRO-FORT-1L', productName: 'Fortune Premium Kachi Ghani Mustard Oil 1L', price: 150, stockOnHand: 90, stockReserved: 2, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-05', skuId: 'MB-SHG-AMLA-500G', skuCode: 'MB-SHG-AMLA-500G', productName: 'Organic Amla & Mango Murabba 500g', price: 170, stockOnHand: 40, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
  { shopId: 'shop-rch-05', skuId: 'MB-DAL-TOOR-1K', skuCode: 'MB-DAL-TOOR-1K', productName: 'Tata Sampann Unpolished Toor Dal 1kg', price: 175, stockOnHand: 80, stockReserved: 0, status: 'LIVE', hasValidBatch: true },
];

// Audit logs persistent store
export const routingAuditLogs: RoutingAuditLogEntry[] = [];

// ----------------------------------------------------
// UTILITY FUNCTIONS: Distance, Operating Hours
// ----------------------------------------------------

// Haversine formula to compute great-circle distance between two coords in kilometers
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Fallback centroid coordinate for standard Ranchi pincodes
export const pincodeCentroids: { [pincode: string]: GeoCoordinate } = {
  '834001': { lat: 23.3441, lng: 85.3096 }, // Main Road / Ranchi Railway
  '834002': { lat: 23.3320, lng: 85.3250 }, // Doranda
  '834003': { lat: 23.3200, lng: 85.3400 }, // Hinoo
  '834004': { lat: 23.3550, lng: 85.3180 }, // Harmu
  '834005': { lat: 23.3350, lng: 85.2950 }, // Dhurwa / HEC
  '834006': { lat: 23.3600, lng: 85.3300 }, // Lalpur / Morabadi
  '834008': { lat: 23.3750, lng: 85.3120 }, // Kanke Road
};

export function isWithinOperatingHours(
  shop: CandidateShop, 
  checkTime: Date = new Date(),
  bufferMinutes: number = 15
): { open: boolean; reason?: string } {
  const currentMinutes = checkTime.getHours() * 60 + checkTime.getMinutes();
  const todayKey = 'all'; // using simplified key or check per day
  const hours = shop.operatingHours[todayKey] || shop.operatingHours['mon'] || { open: '08:00', close: '22:00' };

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);

  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  if (currentMinutes < openTotal) {
    return { open: false, reason: `Shop opens at ${hours.open} (currently ${checkTime.toTimeString().slice(0,5)})` };
  }

  // Check closing buffer: shop must not be closing within buffer minutes
  if (currentMinutes + bufferMinutes > closeTotal) {
    return { open: false, reason: `Shop closes at ${hours.close} (under ${bufferMinutes}m buffer threshold)` };
  }

  return { open: true };
}

// ----------------------------------------------------
// THE CORE ROUTING ENGINE
// ----------------------------------------------------
export class RoutingEngine {
  private config: RoutingConfig;
  private candidateShops: CandidateShop[];
  private listings: ShopItemListing[];

  constructor(
    config: RoutingConfig = currentRoutingConfig,
    shops: CandidateShop[] = registeredCandidateShops,
    listings: ShopItemListing[] = registeredShopListings
  ) {
    this.config = config;
    this.candidateShops = shops;
    this.listings = listings;
  }

  // Update live configuration
  public updateConfig(newConfig: Partial<RoutingConfig>, changedBy: string = 'Admin'): RoutingConfig {
    if (newConfig.weights) {
      const sum = Object.values(newConfig.weights).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new Error(`Weights must sum exactly to 1.00 (Current sum: ${sum.toFixed(3)})`);
      }
    }
    currentRoutingConfig = {
      ...currentRoutingConfig,
      ...newConfig,
      weights: newConfig.weights ? { ...currentRoutingConfig.weights, ...newConfig.weights } : currentRoutingConfig.weights
    };
    routingConfigHistory.push({
      timestamp: new Date().toISOString(),
      config: { ...currentRoutingConfig },
      changedBy
    });
    this.config = currentRoutingConfig;
    return currentRoutingConfig;
  }

  public getConfig(): RoutingConfig {
    return this.config;
  }

  public getConfigHistory() {
    return routingConfigHistory;
  }

  // ----------------------------------------------------
  // 1. HARD FILTERS (F1 to F11)
  // ----------------------------------------------------
  public applyHardFilters(
    ctx: RoutingOrderContext,
    now: Date = new Date()
  ): { eligibleShops: Array<{ shop: CandidateShop; distanceKm: number; totalPrice: number }>; exclusions: FilterExclusion[] } {
    const exclusions: FilterExclusion[] = [];
    const eligibleShops: Array<{ shop: CandidateShop; distanceKm: number; totalPrice: number }> = [];

    // F11: Customer explicit override
    let candidatePool = this.candidateShops;
    if (ctx.customerSelectedShopId) {
      const selected = this.candidateShops.filter(s => s.id === ctx.customerSelectedShopId);
      if (selected.length === 0) {
        exclusions.push({
          shopId: ctx.customerSelectedShopId,
          shopName: 'Customer Chosen Store',
          filterCode: 'F11',
          reason: 'Customer explicitly selected a shop that does not exist in registry',
        });
        return { eligibleShops: [], exclusions };
      }
      candidatePool = selected;
    }

    const destCoords = (ctx.deliveryLat && ctx.deliveryLng)
      ? { lat: ctx.deliveryLat, lng: ctx.deliveryLng }
      : (pincodeCentroids[ctx.deliveryPincode] || { lat: 23.3441, lng: 85.3096 });

    const todayStr = now.toISOString().split('T')[0];

    for (const shop of candidatePool) {
      // F10: Not Excluded (previous rejection / SLA breach in this order)
      if (ctx.excludedShopIds && ctx.excludedShopIds.includes(shop.id)) {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F10',
          reason: 'Shop previously rejected or breached SLA for this order',
        });
        continue;
      }

      // F1: Shop Status & KYC Status
      if (shop.status !== 'ACTIVE' || shop.kycStatus !== 'VERIFIED') {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F1',
          reason: `Shop is ${shop.status} (KYC: ${shop.kycStatus})`,
        });
        continue;
      }

      // F2: Serviceability (Delivery pincode coverage)
      if (ctx.fulfilmentType === 'DELIVERY') {
        if (!shop.serviceablePincodes.includes(ctx.deliveryPincode)) {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F2',
            reason: `Pincode ${ctx.deliveryPincode} is not in shop serviceable area`,
          });
          continue;
        }
      } else if (ctx.fulfilmentType === 'PICKUP' && ctx.pickupPreferredShopId) {
        if (shop.id !== ctx.pickupPreferredShopId) {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F2',
            reason: `Does not match customer chosen pickup location`,
          });
          continue;
        }
      }

      // F3: Operating Hours (with closing buffer)
      const hoursCheck = isWithinOperatingHours(shop, now, this.config.closingBufferMinutes);
      if (!hoursCheck.open) {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F3',
          reason: hoursCheck.reason || 'Shop currently closed',
        });
        continue;
      }

      // F4: Holiday check
      if (shop.holidays.includes(todayStr)) {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F4',
          reason: `Shop is marked on holiday today (${todayStr})`,
        });
        continue;
      }

      // F5: Distance Calculation & Radius Check (Delivery only)
      const distanceKm = calculateHaversineDistanceKm(
        shop.geo.lat,
        shop.geo.lng,
        destCoords.lat,
        destCoords.lng
      );

      if (ctx.fulfilmentType === 'DELIVERY' && distanceKm > shop.deliveryRadiusKm) {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F5',
          reason: `Distance ${distanceKm}km exceeds maximum delivery radius ${shop.deliveryRadiusKm}km`,
        });
        continue;
      }

      // F6: Delivery Capability
      if (ctx.fulfilmentType === 'DELIVERY' && shop.deliveryCapability === 'PICKUP_ONLY') {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F6',
          reason: `Shop operates in self-pickup mode only (cannot deliver)`,
        });
        continue;
      }

      // F8: Daily Capacity check
      if (shop.capacityPerDay > 0 && shop.ordersToday >= shop.capacityPerDay) {
        exclusions.push({
          shopId: shop.id,
          shopName: shop.name,
          filterCode: 'F8',
          reason: `Shop has reached maximum daily capacity (${shop.ordersToday}/${shop.capacityPerDay} orders)`,
        });
        continue;
      }

      // F9: Seller Host Check (for SHG Products)
      let shgSellerFailed = false;
      for (const item of ctx.items) {
        if (item.sellerId) {
          if (!shop.hostedSellerIds || !shop.hostedSellerIds.includes(item.sellerId)) {
            exclusions.push({
              shopId: shop.id,
              shopName: shop.name,
              filterCode: 'F9',
              reason: `Shop is not an authorized host hub for producer ${item.sellerId}`,
            });
            shgSellerFailed = true;
            break;
          }
        }
      }
      if (shgSellerFailed) continue;

      // F7: Item Availability (All items must be LIVE, stockAvailable >= requested, batch_ok)
      let itemUnavailable = false;
      let shopOrderPrice = 0;

      for (const reqItem of ctx.items) {
        const listing = this.listings.find(
          l => l.shopId === shop.id && (l.skuId === reqItem.skuId || l.skuCode === reqItem.skuCode)
        );

        if (!listing) {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F7',
            reason: `SKU ${reqItem.skuCode || reqItem.skuId} is not listed at this shop`,
          });
          itemUnavailable = true;
          break;
        }

        if (listing.status !== 'LIVE') {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F7',
            reason: `SKU ${listing.productName} is currently ${listing.status}`,
          });
          itemUnavailable = true;
          break;
        }

        const availableQty = listing.stockOnHand - listing.stockReserved;
        if (availableQty < reqItem.quantity) {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F7',
            reason: `Insufficient stock for ${listing.productName} (Available: ${availableQty}, Requested: ${reqItem.quantity})`,
          });
          itemUnavailable = true;
          break;
        }

        if (!listing.hasValidBatch) {
          exclusions.push({
            shopId: shop.id,
            shopName: shop.name,
            filterCode: 'F7',
            reason: `FEFO validation failed: No safe batch available for ${listing.productName}`,
          });
          itemUnavailable = true;
          break;
        }

        shopOrderPrice += listing.price * reqItem.quantity;
      }

      if (itemUnavailable) continue;

      // Passed all Hard Filters!
      eligibleShops.push({
        shop,
        distanceKm,
        totalPrice: shopOrderPrice,
      });
    }

    return { eligibleShops, exclusions };
  }

  // ----------------------------------------------------
  // 2. NORMALIZATION & WEIGHTED SCORING FUNCTION (§5)
  // ----------------------------------------------------
  public scoreCandidates(
    candidates: Array<{ shop: CandidateShop; distanceKm: number; totalPrice: number }>,
    now: Date = new Date()
  ): ScoredCandidate[] {
    if (candidates.length === 0) return [];

    const weights = this.config.weights;

    // Extract ranges for min-max normalization across candidate set
    const distances = candidates.map(c => c.distanceKm);
    const dMin = Math.min(...distances);
    const dMax = Math.max(...distances);

    const ratings = candidates.map(c => c.shop.ratingAvg);

    const acceptances = candidates.map(c => c.shop.acceptanceRate30d);
    const aMin = Math.min(...acceptances);
    const aMax = Math.max(...acceptances);

    const ontimes = candidates.map(c => c.shop.onTimeRate30d);
    const oMin = Math.min(...ontimes);
    const oMax = Math.max(...ontimes);

    const loads = candidates.map(c => c.shop.capacityPerDay > 0 ? c.shop.ordersToday / c.shop.capacityPerDay : 0.5);
    const lMin = Math.min(...loads);
    const lMax = Math.max(...loads);

    const prices = candidates.map(c => c.totalPrice);
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);

    return candidates.map(({ shop, distanceKm, totalPrice }) => {
      // S_distance: Closer = 1.0, farther = 0.0
      const sDist = dMax === dMin ? 1.0 : 1.0 - (distanceKm - dMin) / (dMax - dMin);

      // S_rating: (rating - 1) / 4.0
      const sRating = Math.max(0, Math.min(1.0, (shop.ratingAvg - 1) / 4.0));

      // S_acceptance: Higher = 1.0
      const sAccept = aMax === aMin ? 1.0 : (shop.acceptanceRate30d - aMin) / (aMax - aMin);

      // S_ontime: Higher = 1.0
      const sOntime = oMax === oMin ? 1.0 : (shop.onTimeRate30d - oMin) / (oMax - oMin);

      // S_load: Lower load = 1.0
      const rawLoad = shop.capacityPerDay > 0 ? shop.ordersToday / shop.capacityPerDay : 0.5;
      const sLoad = lMax === lMin ? 1.0 : 1.0 - (rawLoad - lMin) / (lMax - lMin);

      // S_price: Cheaper = 1.0
      const sPrice = pMax === pMin ? 1.0 : 1.0 - (totalPrice - pMin) / (pMax - pMin);

      // S_trust: (0 to 5) / 5.0
      const sTrust = Math.max(0, Math.min(1.0, shop.trustScore / 5.0));

      // S_fairness: Days since last order / 7 (max 1.0)
      let daysSinceLastOrder = 7;
      if (shop.lastOrderAt) {
        const diffMs = now.getTime() - new Date(shop.lastOrderAt).getTime();
        daysSinceLastOrder = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      }
      const sFairness = Math.min(1.0, daysSinceLastOrder / 7.0);

      // Base Weighted Score
      let compositeScore =
        weights.distance * sDist +
        weights.rating * sRating +
        weights.acceptance * sAccept +
        weights.ontime * sOntime +
        weights.load * sLoad +
        weights.price * sPrice +
        weights.trust * sTrust +
        weights.fairness * sFairness;

      // Anti-Starvation Rule (§11.2): 0 orders in 7+ days gets +0.05 bonus
      let antiStarvationApplied = false;
      if (daysSinceLastOrder >= this.config.antiStarvationDays) {
        compositeScore += this.config.antiStarvationBonus;
        antiStarvationApplied = true;
      }

      // New Shop Boost (§11.4): First 30 days get +0.03 bonus
      let newShopBoostApplied = false;
      const daysSinceCreated = (now.getTime() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated <= this.config.newShopBoostDays) {
        compositeScore += this.config.newShopBoostBonus;
        newShopBoostApplied = true;
      }

      // High Load Penalty (§11.3): If load > 80%, apply penalty
      if (rawLoad > this.config.highLoadThreshold) {
        compositeScore -= 0.15;
      }

      // Round to 6 decimal places to prevent floating point noise
      const finalScore = Math.round(compositeScore * 1000000) / 1000000;

      // Estimated delivery time: base 15 min prep + 5 min per km
      const estimatedDeliveryMinutes = Math.min(60, Math.max(20, Math.round(15 + distanceKm * 5)));

      return {
        shopId: shop.id,
        shopName: shop.name,
        distanceKm,
        totalPrice,
        score: finalScore,
        factors: {
          distance: Math.round(sDist * 1000) / 1000,
          rating: Math.round(sRating * 1000) / 1000,
          acceptance: Math.round(sAccept * 1000) / 1000,
          ontime: Math.round(sOntime * 1000) / 1000,
          load: Math.round(sLoad * 1000) / 1000,
          price: Math.round(sPrice * 1000) / 1000,
          trust: Math.round(sTrust * 1000) / 1000,
          fairness: Math.round(sFairness * 1000) / 1000,
        },
        bonusApplied: {
          antiStarvation: antiStarvationApplied,
          newShopBoost: newShopBoostApplied,
        },
        estimatedDeliveryMinutes,
      };
    });
  }

  // ----------------------------------------------------
  // 3. SELECTION ALGORITHM & TIE-BREAKER (§6)
  // ----------------------------------------------------
  public selectBestShop(scored: ScoredCandidate[]): ScoredCandidate | null {
    if (scored.length === 0) return null;
    if (scored.length === 1) return scored[0];

    // Sort descending by score. Deterministic tie-breaker:
    // 1. Highest Score
    // 2. Highest Trust Score
    // 3. Highest Rating
    // 4. Lowest Distance
    // 5. Earliest Created At
    const sorted = [...scored].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const shopA = this.candidateShops.find(s => s.id === a.shopId);
      const shopB = this.candidateShops.find(s => s.id === b.shopId);
      if (shopB && shopA) {
        if (shopB.trustScore !== shopA.trustScore) return shopB.trustScore - shopA.trustScore;
        if (shopB.ratingAvg !== shopA.ratingAvg) return shopB.ratingAvg - shopA.ratingAvg;
      }
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return 0;
    });

    return sorted[0];
  }

  // ----------------------------------------------------
  // 4. ROUTE ORDER & ATOMIC STOCK RESERVATION (§8)
  // ----------------------------------------------------
  public async routeOrder(ctx: RoutingOrderContext): Promise<RoutingResult> {
    const startTime = Date.now();
    const attemptNumber = ctx.attemptNumber || 1;

    // Apply Hard Filters
    const { eligibleShops, exclusions } = this.applyHardFilters(ctx);

    if (eligibleShops.length === 0) {
      const latencyMs = Date.now() - startTime;
      const auditEntry: RoutingAuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: ctx.orderId,
        attemptNumber,
        pincode: ctx.deliveryPincode,
        fulfilmentType: ctx.fulfilmentType,
        candidateCount: this.candidateShops.length,
        excludedShops: exclusions,
        scoredShops: [],
        selectionReason: 'NO_SHOP_AVAILABLE',
        latencyMs,
        createdAt: new Date().toISOString(),
      };
      routingAuditLogs.unshift(auditEntry);

      return {
        success: false,
        orderId: ctx.orderId,
        attemptNumber,
        routingAuditId: auditEntry.id,
        candidateCount: this.candidateShops.length,
        scoredCount: 0,
        latencyMs,
        error: 'NO_SHOP_AVAILABLE',
        excludedShops: exclusions,
        scoredShops: [],
      };
    }

    // Score eligible candidates
    const scoredShops = this.scoreCandidates(eligibleShops);

    // Try reservation in order of score rank (handles race conditions §8.2)
    const sortedCandidates = [...scoredShops].sort((a, b) => b.score - a.score);

    let chosenShop: ScoredCandidate | null = null;
    let reservationIds: string[] = [];

    for (const candidate of sortedCandidates) {
      let reservationSuccess = true;
      const candidateResIds: string[] = [];

      // Sort SKUs by skuId to prevent deadlocks (§8.2)
      const sortedItems = [...ctx.items].sort((a, b) => a.skuId.localeCompare(b.skuId));

      for (const item of sortedItems) {
        const ttlMinutes = ctx.fulfilmentType === 'PICKUP'
          ? this.config.softReservationTtlPayStoreMin
          : this.config.softReservationTtlOnlineMin;

        const res = atomicReserveStock({
          skuId: item.skuId,
          quantity: item.quantity,
          orderId: ctx.orderId,
          orderNumber: ctx.orderId,
          ttlMinutes,
        });

        if (res.success && res.reservation) {
          candidateResIds.push(res.reservation.id);
        } else {
          reservationSuccess = false;
          break;
        }
      }

      if (reservationSuccess) {
        chosenShop = candidate;
        reservationIds = candidateResIds;
        break; // Successfully reserved!
      } else {
        // Rollback partial reservations for this candidate
        for (const rId of candidateResIds) {
          releaseStockReservation(rId, 'CONCURRENCY_RACE_ROLLBACK');
        }
        exclusions.push({
          shopId: candidate.shopId,
          shopName: candidate.shopName,
          filterCode: 'F7',
          reason: 'Concurrency race on stock: reservation failed at pick-lock time',
        });
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!chosenShop) {
      const auditEntry: RoutingAuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: ctx.orderId,
        attemptNumber,
        pincode: ctx.deliveryPincode,
        fulfilmentType: ctx.fulfilmentType,
        candidateCount: this.candidateShops.length,
        excludedShops: exclusions,
        scoredShops,
        selectionReason: 'RESERVATION_FAILED_FOR_ALL_CANDIDATES',
        latencyMs,
        createdAt: new Date().toISOString(),
      };
      routingAuditLogs.unshift(auditEntry);

      return {
        success: false,
        orderId: ctx.orderId,
        attemptNumber,
        routingAuditId: auditEntry.id,
        candidateCount: this.candidateShops.length,
        scoredCount: scoredShops.length,
        latencyMs,
        error: 'OUT_OF_STOCK_RACE',
        excludedShops: exclusions,
        scoredShops,
      };
    }

    // Success! Update shop load stats
    const winningShopRef = this.candidateShops.find(s => s.id === chosenShop!.shopId);
    if (winningShopRef) {
      winningShopRef.ordersToday += 1;
      winningShopRef.pendingAcceptance += 1;
      winningShopRef.lastOrderAt = new Date().toISOString();
    }

    const auditEntry: RoutingAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId: ctx.orderId,
      attemptNumber,
      pincode: ctx.deliveryPincode,
      fulfilmentType: ctx.fulfilmentType,
      candidateCount: this.candidateShops.length,
      excludedShops: exclusions,
      scoredShops,
      selectedShopId: chosenShop.shopId,
      selectedShopName: chosenShop.shopName,
      selectionReason: 'HIGHEST_SCORE',
      reservationIds,
      latencyMs,
      createdAt: new Date().toISOString(),
    };
    routingAuditLogs.unshift(auditEntry);

    return {
      success: true,
      orderId: ctx.orderId,
      attemptNumber,
      selectedShopId: chosenShop.shopId,
      selectedShopName: chosenShop.shopName,
      reservationIds,
      estimatedDeliveryMinutes: chosenShop.estimatedDeliveryMinutes,
      routingAuditId: auditEntry.id,
      candidateCount: this.candidateShops.length,
      scoredCount: scoredShops.length,
      winningScore: chosenShop.score,
      latencyMs,
      excludedShops: exclusions,
      scoredShops,
    };
  }

  // ----------------------------------------------------
  // 5. RE-ROUTING FALLBACK ENGINE (§7)
  // ----------------------------------------------------
  public async rerouteOrder(
    ctx: RoutingOrderContext,
    reason: 'SHOP_REJECTED' | 'SLA_EXPIRED' | 'PICKING_OOS' | 'SHOP_OFFLINE' | 'RESERVATION_FAILED',
    rejectedShopId: string
  ): Promise<RoutingResult> {
    const currentAttempt = (ctx.attemptNumber || 1) + 1;

    // Check Max Re-routes (§7.3)
    if (currentAttempt > this.config.maxRerouteAttempts) {
      return {
        success: false,
        orderId: ctx.orderId,
        attemptNumber: currentAttempt,
        routingAuditId: `audit-failed-${Date.now()}`,
        candidateCount: this.candidateShops.length,
        scoredCount: 0,
        latencyMs: 1,
        error: 'MAX_REROUTE_ATTEMPTS_EXCEEDED',
        excludedShops: [
          {
            shopId: rejectedShopId,
            shopName: 'Rejected Shop',
            filterCode: 'F10',
            reason: `Order exceeded maximum fallback attempts (${this.config.maxRerouteAttempts}). Order auto-cancelled.`,
          }
        ],
        scoredShops: [],
      };
    }

    // Customer explicit choice protection (§7.4)
    if (ctx.customerSelectedShopId && ctx.customerSelectedShopId === rejectedShopId) {
      return {
        success: false,
        orderId: ctx.orderId,
        attemptNumber: currentAttempt,
        routingAuditId: `audit-cust-choice-${Date.now()}`,
        candidateCount: 1,
        scoredCount: 0,
        latencyMs: 1,
        error: 'CUSTOMER_CHOICE_UNAVAILABLE',
        excludedShops: [
          {
            shopId: rejectedShopId,
            shopName: 'Customer Chosen Shop',
            filterCode: 'F11',
            reason: 'Customer-selected shop cannot fulfil order. Prompting customer to re-select.',
          }
        ],
        scoredShops: [],
      };
    }

    // Append to excluded shops
    const updatedExclusions = [...(ctx.excludedShopIds || []), rejectedShopId];

    return this.routeOrder({
      ...ctx,
      excludedShopIds: updatedExclusions,
      attemptNumber: currentAttempt,
    });
  }

  // ----------------------------------------------------
  // 6. DIAGNOSTICS: "Why No Shop?" Debugger (§10.2)
  // ----------------------------------------------------
  public debugWhyNoShop(
    pincode: string,
    items: OrderItemRequest[],
    fulfilmentType: 'DELIVERY' | 'PICKUP' = 'DELIVERY'
  ): {
    pincode: string;
    totalShopsInSystem: number;
    filterExclusions: FilterExclusion[];
    eligibleCount: number;
    summary: string;
  } {
    const dummyCtx: RoutingOrderContext = {
      orderId: `test-diag-${Date.now()}`,
      customerId: 'diagnostic-probe',
      fulfilmentType,
      deliveryPincode: pincode,
      items,
    };

    const { eligibleShops, exclusions } = this.applyHardFilters(dummyCtx);

    return {
      pincode,
      totalShopsInSystem: this.candidateShops.length,
      filterExclusions: exclusions,
      eligibleCount: eligibleShops.length,
      summary: eligibleShops.length > 0
        ? `Found ${eligibleShops.length} serviceable candidate shops for pincode ${pincode}`
        : `No shop available for pincode ${pincode}. Evaluated ${this.candidateShops.length} stores, all failed hard filters.`,
    };
  }
}

// Singleton routing engine export
export const routingEngine = new RoutingEngine();
