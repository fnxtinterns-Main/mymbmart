import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MegaBachatMart P0-S1 Idempotent Database Seed...');

  // 1. Seed Master Owner User
  const ownerUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      memberId: 'MBM-OWNER-001',
      name: 'MegaBachatMart Owner',
      phone: '9876543210',
      email: 'owner@megabachatmart.com',
      role: 'SUPER_ADMIN',
      referralCode: 'MBMOWNER',
      level: 'Diamond',
      isActive: true,
    },
  });
  console.log(`✅ Seeded Super Admin: ${ownerUser.email}`);

  // 2. Seed Default Serviceability Pincodes (Ranchi Metro)
  const defaultPincodes = [
    { pincode: '834001', city: 'Ranchi', state: 'Jharkhand', radius: 5.5 },
    { pincode: '834002', city: 'Ranchi', state: 'Jharkhand', radius: 5.0 },
    { pincode: '834004', city: 'Ranchi', state: 'Jharkhand', radius: 6.0 },
    { pincode: '834005', city: 'Ranchi', state: 'Jharkhand', radius: 5.0 },
    { pincode: '834008', city: 'Ranchi', state: 'Jharkhand', radius: 7.0 },
  ];

  for (const p of defaultPincodes) {
    await prisma.serviceablePincode.upsert({
      where: { pincode: p.pincode },
      update: {},
      create: {
        pincode: p.pincode,
        city: p.city,
        state: p.state,
        deliveryRadiusKm: p.radius,
        deliveryActive: true,
        pickupActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${defaultPincodes.length} Serviceable Pincodes in Ranchi`);

  // 3. Seed Default Routing Configuration
  await prisma.routingConfig.upsert({
    where: { key: 'DEFAULT' },
    update: {},
    create: {
      key: 'DEFAULT',
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
      softReservationTtlMin: 15,
      maxRerouteAttempts: 3,
      closingBufferMinutes: 15,
      antiStarvationDays: 7,
      antiStarvationBonus: 0.05,
      updatedBy: 'P0 Seed Script',
    },
  });
  console.log('✅ Seeded Hyperlocal Routing Engine Config');

  console.log('✨ MegaBachatMart P0 Database Seeding Completed Cleanly!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
