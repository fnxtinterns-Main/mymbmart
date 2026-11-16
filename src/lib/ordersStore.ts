// Central store for Orders, Deliveries, and Rider Workflows
export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  deliveryAddress: string;
  pincode: string;
  status: 'PLACED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryOtp: string;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'COD';
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
  globalStore.activeOrders = [
    {
      id: 'ord-pilot-101',
      orderNumber: 'MBM-2026-98124',
      userId: 'usr-1',
      userName: 'Aviraj Sharma',
      userPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 402, Royal Residency, Main Road, Ranchi - 834001',
      pincode: '834001',
      status: 'OUT_FOR_DELIVERY',
      deliveryOtp: '4821',
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      totalMRP: 990,
      totalPayable: 780,
      shoppingSavings: 210,
      creditDeduction: 100,
      cashbackEarnable: 45,
      cashbackCredited: false,
      assignedRider: {
        name: 'Sunil Mahto',
        phone: '+91 94311 22334',
        vehicle: 'EV Scooter (JH-01-CZ-4521)',
      },
      darkStore: {
        id: 'store-ranchi-central',
        name: 'Ranchi Central Dark Store',
        city: 'Ranchi',
        etaMinutes: 20,
      },
      items: [
        {
          productId: 'p-3',
          name: 'Traditional Handmade Aam Ka Achaar (Mango Pickle)',
          quantity: 1,
          unitPrice: 160,
          image: '/images/products/aam_ka_achar.jpg',
          fulfilmentType: 'QUICK_COMMERCE',
        },
        {
          productId: 'p-6',
          name: 'Chakki Fresh Sharbati Whole Wheat Atta (5kg)',
          quantity: 1,
          unitPrice: 220,
          image: '/images/products/chakki_atta.jpg',
          fulfilmentType: 'QUICK_COMMERCE',
        }
      ],
      splitShipments: [
        {
          type: 'QUICK_COMMERCE',
          status: 'OUT_FOR_DELIVERY',
          eta: '12 mins remaining',
          hub: 'Ranchi Central Dark Store',
          itemCount: 2,
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      timeline: [
        { step: 'Order Placed & Stock Reserved', time: '12:45 PM', completed: true },
        { step: 'Picked & Packed at Dark Store', time: '12:49 PM', completed: true },
        { step: 'Rider Sunil Picked Up', time: '12:54 PM', completed: true },
        { step: 'Arriving at Doorstep (Provide OTP 4821)', time: '01:05 PM', completed: false },
      ]
    }
  ];
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

export function updateOrderStatus(orderId: string, status: OrderRecord['status']) {
  const order = ordersStore.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;
  order.status = status;
  if (status === 'PACKED') {
    const step = order.timeline.find((t) => t.step.includes('Packed'));
    if (step) step.completed = true;
  }
  if (status === 'OUT_FOR_DELIVERY') {
    const step = order.timeline.find((t) => t.step.includes('Rider'));
    if (step) step.completed = true;
  }
  if (status === 'DELIVERED') {
    order.timeline.forEach((t) => (t.completed = true));
    order.cashbackCredited = true;
  }
  return order;
}
