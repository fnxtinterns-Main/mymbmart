import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Pilot Dark Stores (e.g. Ranchi, Jharkhand)
const PILOT_DARK_STORES = [
  {
    id: 'store-ranchi-central',
    storeCode: 'MBM-RCH-01',
    name: 'MegaBachatMart Ranchi Central Dark Store',
    city: 'Ranchi',
    state: 'Jharkhand',
    latitude: 23.3441,
    longitude: 85.3096,
    radiusKm: 7.0,
    serviceablePincodes: ['834001', '834002', '834003', '834004', '834005', '834008', '834010'],
    deliveryEtaMins: 25,
    minOrderFreeDelivery: 199,
    status: 'OPEN',
  },
  {
    id: 'store-ranchi-harmu',
    storeCode: 'MBM-RCH-02',
    name: 'MegaBachatMart Harmu Quick Hub',
    city: 'Ranchi',
    state: 'Jharkhand',
    latitude: 23.3620,
    longitude: 85.3120,
    radiusKm: 5.0,
    serviceablePincodes: ['834002', '834012'],
    deliveryEtaMins: 20,
    minOrderFreeDelivery: 199,
    status: 'OPEN',
  },
];

// Haversine distance formula (in km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { latitude, longitude, pincode } = body;

    let matchedStore = null;
    let distance = 0;

    // 1. If GPS coordinates provided, find nearest store within radius
    if (latitude && longitude) {
      for (const store of PILOT_DARK_STORES) {
        if (store.status !== 'OPEN') continue;
        const d = calculateDistanceKm(latitude, longitude, store.latitude, store.longitude);
        if (d <= store.radiusKm) {
          if (!matchedStore || d < distance) {
            matchedStore = store;
            distance = Math.round(d * 10) / 10;
          }
        }
      }
    }

    // 2. If no coordinate match but PIN code provided, match by serviceable PIN codes
    if (!matchedStore && pincode) {
      matchedStore = PILOT_DARK_STORES.find(
        (store) => store.status === 'OPEN' && store.serviceablePincodes.includes(pincode.trim())
      );
      if (matchedStore) {
        distance = 3.2; // default estimated distance
      }
    }

    // Default fallback to pilot flagship store for demo / development
    if (!matchedStore) {
      const defaultStore = PILOT_DARK_STORES[0];
      return NextResponse.json({
        success: true,
        serviceable: true,
        isPilotMode: true,
        fulfilmentType: 'QUICK_COMMERCE',
        distanceKm: 2.8,
        store: {
          id: defaultStore.id,
          name: defaultStore.name,
          city: defaultStore.city,
          deliveryEtaMins: defaultStore.deliveryEtaMins,
          minOrderFreeDelivery: defaultStore.minOrderFreeDelivery,
          status: defaultStore.status,
        },
        message: 'Connected to Ranchi Central Dark Store (Pilot Hub). Delivery in 20-30 mins.',
      });
    }

    return NextResponse.json({
      success: true,
      serviceable: true,
      isPilotMode: false,
      fulfilmentType: 'QUICK_COMMERCE',
      distanceKm: distance,
      store: {
        id: matchedStore.id,
        name: matchedStore.name,
        city: matchedStore.city,
        deliveryEtaMins: matchedStore.deliveryEtaMins,
        minOrderFreeDelivery: matchedStore.minOrderFreeDelivery,
        status: matchedStore.status,
      },
      message: `Delivery available in ${matchedStore.deliveryEtaMins} mins from ${matchedStore.name}`,
    });
  } catch (error) {
    console.error('Serviceability check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify location serviceability' },
      { status: 500 }
    );
  }
}
