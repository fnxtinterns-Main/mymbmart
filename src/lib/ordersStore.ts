// Central store for Orders, Deliveries, and Rider Workflows
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
}

// In-memory persistent order state across Next.js API turns in runtime
const globalStore = global as unknown as { 
  activeOrders: OrderRecord[];
};

if (!globalStore.activeOrders) {
  globalStore.activeOrders = [];
}

export const ordersStore = globalStore.activeOrders;

export function addOrder(order: OrderRecord) {
  ordersStore.unshift(order);
  return order;
}

export function getOrderById(idOrNumber: string) {
  return ordersStore.find(
    (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
  );
}

export function updateOrderStatus(orderId: string, status: OrderRecord['status'], notes?: string) {
  const order = ordersStore.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;
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
  }
  if (status === 'CANCELLED') {
    if (notes) order.cancellationReason = notes;
    order.refundStatus = order.paymentStatus === 'PAID' ? 'PENDING' : 'NONE';
  }
  if (status === 'RETURNED') {
    order.refundStatus = 'PENDING';
  }
  return order;
}
