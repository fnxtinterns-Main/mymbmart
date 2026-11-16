// Central in-memory store for Store Management & Self-Pickup Slots (Ranchi Central MBM-RCH-01)

export interface StoreSlotConfig {
  storeId: string;
  storeName: string;
  address: string;
  openingTime: string; // e.g. "09:00"
  closingTime: string; // e.g. "21:00"
  slotDurationMinutes: number; // 15, 30, 60
  maxOrdersPerSlot: number;
  preparationBufferMinutes: number;
  advanceBookingDays: number;
  sameDayPickupEnabled: boolean;
  holidays: string[]; // YYYY-MM-DD
  slots: Array<{
    id: string;
    timeRange: string; // "09:00 - 09:30"
    available: boolean;
    bookedOrdersCount: number;
  }>;
}

const defaultSlots = [
  { id: 'slot-1', timeRange: '09:00 - 09:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-2', timeRange: '09:30 - 10:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-3', timeRange: '10:00 - 10:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-4', timeRange: '10:30 - 11:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-5', timeRange: '11:00 - 11:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-6', timeRange: '11:30 - 12:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-7', timeRange: '12:00 - 12:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-8', timeRange: '12:30 - 13:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-9', timeRange: '14:00 - 14:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-10', timeRange: '14:30 - 15:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-11', timeRange: '15:00 - 15:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-12', timeRange: '15:30 - 16:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-13', timeRange: '16:00 - 16:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-14', timeRange: '16:30 - 17:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-15', timeRange: '17:00 - 17:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-16', timeRange: '17:30 - 18:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-17', timeRange: '18:00 - 18:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-18', timeRange: '18:30 - 19:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-19', timeRange: '19:00 - 19:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-20', timeRange: '19:30 - 20:00', available: true, bookedOrdersCount: 0 },
  { id: 'slot-21', timeRange: '20:00 - 20:30', available: true, bookedOrdersCount: 0 },
  { id: 'slot-22', timeRange: '20:30 - 21:00', available: true, bookedOrdersCount: 0 }
];

const globalStore = global as unknown as {
  storeSlotConfig: StoreSlotConfig;
};

if (!globalStore.storeSlotConfig) {
  globalStore.storeSlotConfig = {
    storeId: 'MBM-RCH-01',
    storeName: 'MegaBachatMart Ranchi Central Store',
    address: 'Circular Road, Lalpur, Ranchi, Jharkhand - 834001',
    openingTime: '09:00',
    closingTime: '21:00',
    slotDurationMinutes: 30,
    maxOrdersPerSlot: 10,
    preparationBufferMinutes: 20,
    advanceBookingDays: 3,
    sameDayPickupEnabled: true,
    holidays: [],
    slots: defaultSlots
  };
}

export const pickupSlotsConfig = globalStore.storeSlotConfig;

export function updateSlotConfig(updates: Partial<StoreSlotConfig>) {
  Object.assign(pickupSlotsConfig, updates);
  return pickupSlotsConfig;
}

export function toggleSlotAvailability(slotId: string, available: boolean) {
  const slot = pickupSlotsConfig.slots.find(s => s.id === slotId);
  if (slot) slot.available = available;
  return slot;
}

export function reserveSlotCapacity(slotId: string) {
  const slot = pickupSlotsConfig.slots.find(s => s.id === slotId);
  if (!slot) return { success: false, error: 'Slot not found' };
  if (!slot.available || slot.bookedOrdersCount >= pickupSlotsConfig.maxOrdersPerSlot) {
    return { success: false, error: 'Slot capacity full or unavailable' };
  }
  slot.bookedOrdersCount += 1;
  return { success: true, slot };
}
