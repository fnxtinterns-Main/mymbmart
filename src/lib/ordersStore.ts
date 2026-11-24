// Central store for Orders, Deliveries, and Rider Workflows
import { redisSet, redisGet, isRedisConfigured } from './redis';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  deliveryAddress: string;
  pincode: string;
  status: 
    | 'NEW' 
    | 'PLACED' 
    | 'ACCEPTED'
    | 'CONFIRMED' 
    | 'PICKING'
    | 'PACKING'
    | 'PROCESSING' 
    | 'PACKED' 
    | 'READY_FOR_DISPATCH' 
    | 'READY_FOR_PICKUP'
    | 'OUT_FOR_DELIVERY' 
    | 'AWAITING_COLLECTION'
    | 'DELIVERED' 
    | 'COLLECTED'
    | 'PICKUP_EXPIRED'
    | 'CANCELLED' 
    | 'REJECTED'
    | 'FAILED' 
    | 'RETURNED';
  fulfilmentType: 'HOME_DELIVERY' | 'SELF_PICKUP';
  fulfilmentChannel?: 'QUICK_COMMERCE' | 'STANDARD_ECOMMERCE';
  pickupDetails?: {
    storeId: string;
    storeName: string;
    storeAddress: string;
    slotDate: string;
    slotTime: string;
    qrToken: string;
    pickupOtp: string;
    paymentMode: 'ONLINE' | 'PAY_AT_STORE';
    inStorePaymentReceived?: boolean;
    inStorePaymentMethod?: string;
    collectedAt?: string;
    verifiedByStaff?: string;
  };
  liveTracking?: {
    gpsEnabled: boolean;
    currentLat: number;
    currentLng: number;
    destinationLat: number;
    destinationLng: number;
    etaMinutes: number;
    fleetType: 'IN_HOUSE_RIDER' | 'THIRD_PARTY_PARTNER';
    partnerName?: string;
  };
  invoiceNumber?: string;
  cancellationReason?: string;
  refundStatus?: 'NONE' | 'PENDING' | 'PROCESSED';
  deliveryOtp: string;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'COD';
  upiTransactionId?: string;
  totalMRP: number;
  totalPayable: number;
  shoppingSavings: number;
  creditDeduction: number;
  cashbackEarnable: number;
  cashbackCredited: boolean;
  assignedRider?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  darkStore: {
    id: string;
    name: string;
    city: string;
    etaMinutes: number;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image: string;
    fulfilmentType: string;
  }>;
  splitShipments: Array<{
    type: string;
    status: string;
    eta: string;
    hub: string;
    itemCount: number;
  }>;
  createdAt: string;
  timeline: Array<{
    step: string;
    time: string;
    completed: boolean;
  }>;
  routingAudit?: {
    auditId: string;
    selectedShopId: string;
    selectedShopName: string;
    candidateCount: number;
    winningScore?: number;
    latencyMs: number;
    excludedReasons?: Array<{ shopName: string; reason: string }>;
  };
}

export const initialPilotOrders: OrderRecord[] = [];

// In-memory fallback order cache across Next.js API turns
const globalStore = global as unknown as { 
  activeOrders: OrderRecord[];
};

if (!globalStore.activeOrders) {
  globalStore.activeOrders = [];
}

export async function syncOrdersFromRedis(): Promise<OrderRecord[]> {
  if (isRedisConfigured()) {
    try {
      const remote = await redisGet<OrderRecord[]>('orders:latest');
      if (Array.isArray(remote) && remote.length > 0) {
        return remote;
      }
    } catch {}
  }
  return globalStore.activeOrders;
}

export const ordersStore = globalStore.activeOrders;

export function addOrder(order: OrderRecord) {
  ordersStore.unshift(order);
  if (isRedisConfigured()) {
    redisSet('orders:latest', ordersStore).catch(() => {});
    redisSet(`order:${order.id}`, order).catch(() => {});
    if (order.orderNumber) {
      redisSet(`order:${order.orderNumber}`, order).catch(() => {});
    }
  }
  return order;
}

export function getOrderById(idOrNumber: string) {
  return ordersStore.find(
    (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
  );
}

export async function getOrderByIdAsync(idOrNumber: string): Promise<OrderRecord | undefined> {
  // PostgreSQL is primary source of truth across Passenger processes
  try {
    const { prisma } = await import('./prisma');
    const dbOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: {
        deliveryAddress: true,
        user: true,
      },
    });
    if (dbOrder) {
      const mapped: OrderRecord = {
        id: dbOrder.id,
        orderNumber: dbOrder.orderNumber,
        userId: dbOrder.userId,
        userName: dbOrder.user?.name || 'Customer',
        userPhone: dbOrder.user?.phone || '',
        deliveryAddress: dbOrder.deliveryAddress?.fullAddress || 'Main Road, Ranchi Central - 834001',
        pincode: dbOrder.deliveryAddress?.pincode || '834001',
        status: dbOrder.orderStatus as any,
        totalPayable: dbOrder.finalPayable,
        totalMRP: dbOrder.totalMRP,
        shoppingSavings: (dbOrder.totalMRP - dbOrder.totalBachatPrice) || 0,
        creditDeduction: dbOrder.creditsApplied || 0,
        paymentStatus: dbOrder.paymentStatus as any,
        paymentMethod: dbOrder.paymentMethod as any,
        fulfilmentType: 'HOME_DELIVERY',
        deliveryOtp: dbOrder.deliveryOtp || '1234',
        cashbackEarnable: 0,
        cashbackCredited: false,
        darkStore: {
          id: 'store-ranchi-central',
          name: 'Ranchi Central Dark Store',
          city: 'Ranchi',
          etaMinutes: 25,
        },
        items: [],
        splitShipments: [],
        createdAt: dbOrder.createdAt instanceof Date ? dbOrder.createdAt.toISOString() : String(dbOrder.createdAt),
        timeline: [
          { step: 'Order Placed & Stock Locked', time: 'Just now', completed: true },
        ],
      };
      return mapped;
    }
  } catch {}

  // Fallback to Redis cache or in-memory
  if (isRedisConfigured()) {
    try {
      const fromRedis = await redisGet<OrderRecord>(`order:${idOrNumber}`);
      if (fromRedis) return fromRedis;
    } catch {}
  }
  return getOrderById(idOrNumber);
}

// Allowed state machine transitions to prevent illegal step-skipping or post-delivery tampering
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  NEW: ['PLACED', 'CANCELLED'],
  PLACED: ['ACCEPTED', 'CONFIRMED', 'CANCELLED'],
  ACCEPTED: ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PICKING', 'PACKED', 'CANCELLED'],
  PROCESSING: ['PICKING', 'PACKED', 'CANCELLED'],
  PICKING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_DISPATCH', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DISPATCH: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['COLLECTED', 'PICKUP_EXPIRED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED', 'RETURNED'],
  AWAITING_COLLECTION: ['COLLECTED', 'PICKUP_EXPIRED', 'CANCELLED'],
  DELIVERED: [], // Terminal: delivered orders cannot be cancelled or modified
  COLLECTED: [], // Terminal
  CANCELLED: [], // Terminal: cancelled orders cannot be revived
  FAILED: ['CANCELLED', 'RETURNED'],
  RETURNED: [], // Terminal
  REJECTED: [], // Terminal
  PICKUP_EXPIRED: ['CANCELLED', 'RETURNED'],
};

export function updateOrderStatus(orderId: string, status: OrderRecord['status'], notes?: string) {
  const order = ordersStore.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;

  // Strict state machine validation
  const allowedNext = VALID_ORDER_TRANSITIONS[order.status] || [];
  if (order.status !== status && !allowedNext.includes(status)) {
    throw new Error(`Invalid state transition: Cannot transition order ${order.orderNumber} from "${order.status}" to "${status}".`);
  }

  order.status = status;
  if (status === 'CONFIRMED') {
    const step = order.timeline.find((t) => t.step.toLowerCase().includes('confirm') || t.step.toLowerCase().includes('placed'));
    if (step) step.completed = true;
  }
  if (status === 'PROCESSING') {
    const step = order.timeline.find((t) => t.step.toLowerCase().includes('process') || t.step.toLowerCase().includes('packed'));
    if (step) step.completed = true;
  }
  if (status === 'PACKED' || status === 'READY_FOR_DISPATCH') {
    const step = order.timeline.find((t) => t.step.toLowerCase().includes('pack'));
    if (step) step.completed = true;
  }
  if (status === 'OUT_FOR_DELIVERY') {
    const step = order.timeline.find((t) => t.step.toLowerCase().includes('rider') || t.step.toLowerCase().includes('out'));
    if (step) step.completed = true;
  }
  if (status === 'DELIVERED') {
    order.timeline.forEach((t) => (t.completed = true));
    order.cashbackCredited = true;
    if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
      order.paymentStatus = 'PAID';
      if (process.env.DATABASE_URL) {
        import('@/lib/ledgerStore').then(({ financialLedger }) => {
          financialLedger.recordOrderSettlement({
            orderId: order.id,
            grossAmount: order.totalPayable + (order.creditDeduction || 0),
            walletPaid: order.creditDeduction || 0,
            gatewayPaid: order.totalPayable,
            idempotencyKey: `settle-cod-${order.id}`,
          }).catch((err) => console.error('COD settlement error:', err));
        }).catch(() => {});
      }
    }
  }
  if (status === 'CANCELLED') {
    if (notes) order.cancellationReason = notes;
    order.refundStatus = order.paymentStatus === 'PAID' ? 'PENDING' : 'NONE';
    // Reverse any cashback and mark wallet credit for auto-refund
    order.cashbackCredited = false;
    order.cashbackEarnable = 0;
    if (order.paymentStatus === 'PAID' && process.env.DATABASE_URL) {
      import('@/lib/ledgerStore').then(({ financialLedger }) => {
        financialLedger.recordRefundReversal({
          orderId: order.id,
          gatewayRefund: order.totalPayable,
          walletRefund: order.creditDeduction || 0,
          refundId: `ref-cancel-${order.id}`,
        }).then(() => {
          order.refundStatus = 'PROCESSED';
        }).catch((err) => console.error('Auto-refund error on cancel:', err));
      }).catch(() => {});
    }
  }
  if (status === 'RETURNED') {
    order.refundStatus = 'PENDING';
    order.cashbackCredited = false;
    order.cashbackEarnable = 0;
    if (order.paymentStatus === 'PAID' && process.env.DATABASE_URL) {
      import('@/lib/ledgerStore').then(({ financialLedger }) => {
        financialLedger.recordRefundReversal({
          orderId: order.id,
          gatewayRefund: order.totalPayable,
          walletRefund: order.creditDeduction || 0,
          refundId: `ref-return-${order.id}`,
        }).then(() => {
          order.refundStatus = 'PROCESSED';
        }).catch((err) => console.error('Auto-refund error on return:', err));
      }).catch(() => {});
    }
  }
  if (isRedisConfigured()) {
    redisSet('orders:latest', ordersStore).catch(() => {});
    redisSet(`order:${order.id}`, order).catch(() => {});
    if (order.orderNumber) {
      redisSet(`order:${order.orderNumber}`, order).catch(() => {});
    }
  }
  return order;
}
