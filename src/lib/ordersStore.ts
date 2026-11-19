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

export const initialPilotOrders: OrderRecord[] = [
  {
    id: 'ord-90519',
    orderNumber: 'MBM-2026-90519',
    userId: 'usr-aviraj',
    userName: 'Aviraj Kumar',
    userPhone: '+91 98015 06511',
    deliveryAddress: 'Main Road, Ranchi Central - 834001',
    pincode: '834001',
    fulfilmentType: 'HOME_DELIVERY',
    status: 'PLACED',
    deliveryOtp: '6234',
    paymentMethod: 'PHONEPE_UPI',
    paymentStatus: 'PAID',
    upiTransactionId: 'UPI-TXN-90519',
    totalMRP: 225,
    totalPayable: 194,
    shoppingSavings: 31,
    creditDeduction: 0,
    cashbackEarnable: 10,
    cashbackCredited: false,
    darkStore: {
      id: 'store-ranchi-central',
      name: 'Ranchi Central Dark Store',
      city: 'Ranchi',
      etaMinutes: 25,
    },
    items: [
      {
        productId: 'p-1',
        name: 'Fortune Sunlite Refined Sunflower Oil (1L)',
        quantity: 1,
        unitPrice: 138,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
      {
        productId: 'p-4',
        name: 'Medha Farm Fresh Pasteurized Cow Milk (1L)',
        quantity: 1,
        unitPrice: 56,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
    ],
    splitShipments: [
      {
        type: 'QUICK_COMMERCE',
        status: 'PLACED',
        eta: '20–25 Mins',
        hub: 'Ranchi Central Dark Store',
        itemCount: 2,
      },
    ],
    createdAt: 'Today, 01:02 PM',
    timeline: [
      { step: 'Order Placed & Stock Locked', time: 'Just now', completed: true },
      { step: 'Dark Store Packing Started', time: 'In 3 mins', completed: false },
      { step: 'Rider Pick-up & Dispatch', time: 'In 8 mins', completed: false },
      { step: 'Delivery at Doorstep (OTP: 6234)', time: 'In 20–25 mins', completed: false },
    ],
  },
  {
    id: 'ord-88124',
    orderNumber: 'MBM-2026-88124',
    userId: 'usr-pooja',
    userName: 'Pooja Sharma',
    userPhone: '+91 94311 23456',
    deliveryAddress: 'Harmu Housing Colony, Ranchi - 834002',
    pincode: '834002',
    fulfilmentType: 'HOME_DELIVERY',
    status: 'PACKED',
    deliveryOtp: '4192',
    paymentMethod: 'PHONEPE_UPI',
    paymentStatus: 'PAID',
    upiTransactionId: 'UPI-TXN-88124',
    totalMRP: 420,
    totalPayable: 345,
    shoppingSavings: 75,
    creditDeduction: 0,
    cashbackEarnable: 15,
    cashbackCredited: false,
    darkStore: {
      id: 'store-ranchi-central',
      name: 'Ranchi Central Dark Store',
      city: 'Ranchi',
      etaMinutes: 20,
    },
    items: [
      {
        productId: 'p-2',
        name: 'Premium Basmati Rice (Royal Harvest)',
        quantity: 1,
        unitPrice: 285,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
    ],
    splitShipments: [
      {
        type: 'QUICK_COMMERCE',
        status: 'PACKED',
        eta: '15–20 Mins',
        hub: 'Ranchi Central Dark Store',
        itemCount: 1,
      },
    ],
    createdAt: 'Today, 12:45 PM',
    timeline: [
      { step: 'Order Placed & Stock Locked', time: '12:45 PM', completed: true },
      { step: 'Dark Store Packing Started', time: '12:48 PM', completed: true },
      { step: 'Rider Pick-up & Dispatch', time: 'Staged for Rider', completed: false },
      { step: 'Delivery at Doorstep (OTP: 4192)', time: 'In 15–20 mins', completed: false },
    ],
  },
  {
    id: 'ord-76412',
    orderNumber: 'MBM-2026-76412',
    userId: 'usr-amit',
    userName: 'Amit Verma',
    userPhone: '+91 97714 88291',
    deliveryAddress: 'Lalpur Chowk, Circular Road, Ranchi - 834001',
    pincode: '834001',
    fulfilmentType: 'HOME_DELIVERY',
    status: 'OUT_FOR_DELIVERY',
    deliveryOtp: '8271',
    paymentMethod: 'COD',
    paymentStatus: 'COD',
    totalMRP: 250,
    totalPayable: 210,
    shoppingSavings: 40,
    creditDeduction: 0,
    cashbackEarnable: 8,
    cashbackCredited: false,
    assignedRider: {
      name: 'Ramesh Kumar',
      phone: '+91 82103 44109',
      vehicle: 'MBM Green EV Rider (JH-01-ET-2026)',
    },
    darkStore: {
      id: 'store-ranchi-central',
      name: 'Ranchi Central Dark Store',
      city: 'Ranchi',
      etaMinutes: 10,
    },
    items: [
      {
        productId: 'p-3',
        name: 'Organic Toor Dal (Desi Unpolished)',
        quantity: 1,
        unitPrice: 145,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
    ],
    splitShipments: [
      {
        type: 'QUICK_COMMERCE',
        status: 'OUT_FOR_DELIVERY',
        eta: '8–10 Mins',
        hub: 'Ranchi Central Dark Store',
        itemCount: 1,
      },
    ],
    createdAt: 'Today, 12:30 PM',
    timeline: [
      { step: 'Order Placed & Stock Locked', time: '12:30 PM', completed: true },
      { step: 'Dark Store Packing Started', time: '12:33 PM', completed: true },
      { step: 'Rider Pick-up & Dispatch', time: '12:38 PM', completed: true },
      { step: 'Delivery at Doorstep (OTP: 8271)', time: 'On the way (8 mins)', completed: false },
    ],
  },
  {
    id: 'ord-54129',
    orderNumber: 'MBM-2026-54129',
    userId: 'usr-sunita',
    userName: 'Sunita Devi',
    userPhone: '+91 93345 77102',
    deliveryAddress: 'Kanke Road, Ranchi - 834008',
    pincode: '834008',
    fulfilmentType: 'HOME_DELIVERY',
    status: 'DELIVERED',
    deliveryOtp: '3310',
    paymentMethod: 'PHONEPE_UPI',
    paymentStatus: 'PAID',
    upiTransactionId: 'UPI-TXN-54129',
    totalMRP: 680,
    totalPayable: 560,
    shoppingSavings: 120,
    creditDeduction: 0,
    cashbackEarnable: 25,
    cashbackCredited: true,
    assignedRider: {
      name: 'Vikash Oraon',
      phone: '+91 79032 11984',
      vehicle: 'MBM Green EV Rider (JH-01-ET-1984)',
    },
    darkStore: {
      id: 'store-ranchi-central',
      name: 'Ranchi Central Dark Store',
      city: 'Ranchi',
      etaMinutes: 0,
    },
    items: [
      {
        productId: 'p-1',
        name: 'Fortune Sunlite Refined Sunflower Oil (1L)',
        quantity: 2,
        unitPrice: 138,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
      {
        productId: 'p-2',
        name: 'Premium Basmati Rice (Royal Harvest)',
        quantity: 1,
        unitPrice: 285,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
        fulfilmentType: 'QUICK_COMMERCE',
      },
    ],
    splitShipments: [
      {
        type: 'QUICK_COMMERCE',
        status: 'DELIVERED',
        eta: 'Delivered',
        hub: 'Ranchi Central Dark Store',
        itemCount: 2,
      },
    ],
    createdAt: 'Today, 11:50 AM',
    timeline: [
      { step: 'Order Placed & Stock Locked', time: '11:50 AM', completed: true },
      { step: 'Dark Store Packing Started', time: '11:53 AM', completed: true },
      { step: 'Rider Pick-up & Dispatch', time: '11:58 AM', completed: true },
      { step: 'Delivery at Doorstep (OTP: 3310)', time: 'Delivered at 12:15 PM', completed: true },
    ],
  },
];

// In-memory persistent order state across Next.js API turns in runtime
const globalStore = global as unknown as { 
  activeOrders: OrderRecord[];
};

if (!globalStore.activeOrders || globalStore.activeOrders.length === 0) {
  globalStore.activeOrders = [...initialPilotOrders];
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
  }
  if (status === 'CANCELLED') {
    if (notes) order.cancellationReason = notes;
    order.refundStatus = order.paymentStatus === 'PAID' ? 'PENDING' : 'NONE';
    // Reverse any cashback and mark wallet credit for auto-refund
    order.cashbackCredited = false;
    order.cashbackEarnable = 0;
  }
  if (status === 'RETURNED') {
    order.refundStatus = 'PENDING';
    order.cashbackCredited = false;
    order.cashbackEarnable = 0;
  }
  return order;
}
