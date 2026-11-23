// scripts/test-concurrency-burst.mjs
// V5.3.2-F Production Concurrency Burst Test
// 50+ simultaneous parallel checkouts against live PostgreSQL
import { prisma } from '../src/lib/prisma.ts';
import { outboxWorker } from '../src/lib/outboxWorker.ts';

async function runConcurrencyBurst() {
  console.log('======================================================');
  console.log('⚡ V5.3.2-F PRODUCTION CONCURRENCY BURST TEST (50+ CHECKS)');
  console.log('Target: AWS EC2 PostgreSQL (13.205.112.255:5432 / mymbmart)');
  console.log('======================================================\n');

  // 1. Setup Test Stores and Products
  console.log('▶ [1/5] Setting up multi-store inventory fixture...');
  const storeA = await prisma.store.upsert({
    where: { storeCode: 'BURST_STORE_A' },
    update: { status: 'OPEN' },
    create: {
      storeCode: 'BURST_STORE_A',
      name: 'Burst Hub Ranchi North',
      address: 'North Main Road, Ranchi',
      latitude: 23.35,
      longitude: 85.33,
    },
  });

  const storeB = await prisma.store.upsert({
    where: { storeCode: 'BURST_STORE_B' },
    update: { status: 'OPEN' },
    create: {
      storeCode: 'BURST_STORE_B',
      name: 'Burst Hub Ranchi South',
      address: 'South Main Road, Ranchi',
      latitude: 23.31,
      longitude: 85.31,
    },
  });

  // Find or create category
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        slug: 'staples',
        name: 'Daily Staples',
      },
    });
  }

  const product = await prisma.product.upsert({
    where: { slug: 'burst-flash-sale-tea' },
    update: { name: 'Tata Tea Gold 500g Flash Sale' },
    create: {
      sku: 'SKU-BURST-TEA-01',
      slug: 'burst-flash-sale-tea',
      name: 'Tata Tea Gold 500g Flash Sale',
      categoryId: category.id,
      unit: '500g',
      imageUrl: '/images/products/tea.png',
      mrp: 320,
      bachatPrice: 280,
    },
  });

  let user = await prisma.user.findFirst({
    include: { addresses: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        memberId: 'MBM-MEM-BURST-01',
        phone: '9999900001',
        name: 'Burst Test Buyer',
        referralCode: 'BURST01',
      },
      include: { addresses: true },
    });
  }

  let address = user.addresses?.[0];
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        recipientName: user.name,
        recipientPhone: user.phone,
        fullAddress: 'Flat 101, Test Tower, Ranchi',
        pincode: '834001',
      },
    });
  }

  // Set explicit starting inventory:
  // Store A has 15 units available
  // Store B has 20 units available
  const INITIAL_STOCK_A = 15;
  const INITIAL_STOCK_B = 20;

  await prisma.storeInventory.upsert({
    where: { storeId_productId: { storeId: storeA.id, productId: product.id } },
    update: { quantityAvailable: INITIAL_STOCK_A, quantityReserved: 0 },
    create: { storeId: storeA.id, productId: product.id, quantityAvailable: INITIAL_STOCK_A, quantityReserved: 0 },
  });

  await prisma.storeInventory.upsert({
    where: { storeId_productId: { storeId: storeB.id, productId: product.id } },
    update: { quantityAvailable: INITIAL_STOCK_B, quantityReserved: 0 },
    create: { storeId: storeB.id, productId: product.id, quantityAvailable: INITIAL_STOCK_B, quantityReserved: 0 },
  });

  console.log(`✅ Fixture Ready:`);
  console.log(`   Product : ${product.name} (${product.id})`);
  console.log(`   Store A : ${storeA.name} Initial Stock = ${INITIAL_STOCK_A}`);
  console.log(`   Store B : ${storeB.name} Initial Stock = ${INITIAL_STOCK_B}\n`);

  // 2. Define Atomic Checkout Execution
  const runBatchId = Date.now();
  const simulateCheckout = async (storeId, requestId) => {
    const orderId = `burst-${runBatchId}-${storeId.slice(0, 4)}-${requestId}`;
    const orderNumber = `BURST-${runBatchId}-${requestId}`;

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // Atomic store-scoped reservation
          const storeInv = await tx.storeInventory.findFirst({
            where: { storeId, productId: product.id },
          });

          if (!storeInv || storeInv.quantityAvailable < 1) {
            throw new Error('STOCK_EXHAUSTED');
          }

          const updated = await tx.storeInventory.updateMany({
            where: {
              storeId,
              productId: product.id,
              quantityAvailable: { gte: 1 },
            },
            data: {
              quantityAvailable: { decrement: 1 },
              quantityReserved: { increment: 1 },
            },
          });

          if (updated.count === 0) {
            throw new Error('STOCK_EXHAUSTED');
          }

          // Create Order
          const order = await tx.order.create({
            data: {
              id: orderId,
              orderNumber,
              userId: user.id,
              addressId: address.id,
              totalMRP: product.mrp,
              totalBachatPrice: product.bachatPrice,
              finalPayable: product.bachatPrice,
              paymentStatus: 'PAID',
              paymentMethod: 'UPI',
              orderStatus: 'PLACED',
            },
          });

          // Create OutboxEvent
          await tx.outboxEvent.create({
            data: {
              eventType: 'ORDER_PLACED',
              aggregateType: 'ORDER',
              aggregateId: order.id,
              payload: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                storeId,
                amount: product.bachatPrice,
              },
              idempotencyKey: `outbox-${order.id}`,
            },
          });

          return { success: true, orderId, storeId };
        },
        {
          maxWait: 25000,
          timeout: 25000,
        }
      );

      return result;
    } catch (err) {
      return { success: false, error: err.message, storeId };
    }
  };

  // 3. Launch 60 Simultaneous Parallel Checkouts
  // 35 checkouts competing for Store A (Capacity: 15)
  // 25 checkouts competing for Store B (Capacity: 20)
  // Total: 60 concurrent requests
  console.log('▶ [2/5] Firing 60 simultaneous parallel checkouts against PostgreSQL...');
  console.log('   - 35 concurrent requests targeting Store A (Capacity: 15)');
  console.log('   - 25 concurrent requests targeting Store B (Capacity: 20)');

  const requests = [];
  for (let i = 1; i <= 35; i++) {
    requests.push(simulateCheckout(storeA.id, `A-${i}`));
  }
  for (let i = 1; i <= 25; i++) {
    requests.push(simulateCheckout(storeB.id, `B-${i}`));
  }

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const elapsedMs = Date.now() - startTime;

  console.log(`⏱ Completed 60 concurrent requests in ${elapsedMs}ms.\n`);

  // 4. Verify Invariants
  console.log('▶ [3/5] Verifying inventory invariants & overselling prevention...');
  const successA = results.filter((r) => r.storeId === storeA.id && r.success).length;
  const failedA = results.filter((r) => r.storeId === storeA.id && !r.success).length;

  const successB = results.filter((r) => r.storeId === storeB.id && r.success).length;
  const failedB = results.filter((r) => r.storeId === storeB.id && !r.success).length;

  console.log(`   Store A: ${successA} succeeded, ${failedA} rejected (Expected: ${INITIAL_STOCK_A} succ, ${35 - INITIAL_STOCK_A} rej)`);
  console.log(`   Store B: ${successB} succeeded, ${failedB} rejected (Expected: ${INITIAL_STOCK_B} succ, ${25 - INITIAL_STOCK_B} rej)`);
  if (failedB > 0) {
    console.log(`   Store B error sample:`, results.filter(r => r.storeId === storeB.id && !r.success).slice(0, 2).map(r => r.error));
  }

  if (successA !== INITIAL_STOCK_A) {
    throw new Error(`Overselling or under-selling in Store A! Expected exactly ${INITIAL_STOCK_A}, got ${successA}`);
  }
  if (successB !== INITIAL_STOCK_B) {
    throw new Error(`Overselling or under-selling in Store B! Expected exactly ${INITIAL_STOCK_B}, got ${successB}`);
  }

  // Check database final stock counts
  const finalStockA = await prisma.storeInventory.findUnique({
    where: { storeId_productId: { storeId: storeA.id, productId: product.id } },
  });
  const finalStockB = await prisma.storeInventory.findUnique({
    where: { storeId_productId: { storeId: storeB.id, productId: product.id } },
  });

  console.log(`   Final Stock Store A: available = ${finalStockA.quantityAvailable}, reserved = ${finalStockA.quantityReserved}`);
  console.log(`   Final Stock Store B: available = ${finalStockB.quantityAvailable}, reserved = ${finalStockB.quantityReserved}`);

  if (finalStockA.quantityAvailable !== 0 || finalStockA.quantityReserved !== INITIAL_STOCK_A) {
    throw new Error(`Invalid final stock for Store A: available ${finalStockA.quantityAvailable}, reserved ${finalStockA.quantityReserved}`);
  }
  if (finalStockB.quantityAvailable !== 0 || finalStockB.quantityReserved !== INITIAL_STOCK_B) {
    throw new Error(`Invalid final stock for Store B: available ${finalStockB.quantityAvailable}, reserved ${finalStockB.quantityReserved}`);
  }
  console.log('✅ ZERO OVERSELLING: Stock decremented to exactly 0, reserved equals total capacity.\n');

  // 5. Verify Outbox Events & Parallel Processing
  console.log('▶ [4/5] Verifying Outbox Events generated...');
  const pendingOutbox = await prisma.outboxEvent.count({
    where: {
      eventType: 'ORDER_PLACED',
      status: 'PENDING',
      idempotencyKey: { startsWith: `outbox-burst-${runBatchId}` },
    },
  });

  const expectedTotalOrders = INITIAL_STOCK_A + INITIAL_STOCK_B;
  console.log(`   Total Outbox Events created: ${pendingOutbox} (Expected: ${expectedTotalOrders})`);
  if (pendingOutbox !== expectedTotalOrders) {
    throw new Error(`Outbox event count mismatch! Expected ${expectedTotalOrders}, got ${pendingOutbox}`);
  }
  console.log('✅ Outbox events matched successful orders 1:1.\n');

  // 6. Test Parallel Worker Processing of Burst Events
  console.log('▶ [5/5] Processing burst Outbox Events via OutboxWorker...');
  const res = await outboxWorker.processBatch(50);
  console.log(`   Claimed: ${res.claimed}, Succeeded: ${res.succeeded}, Failed: ${res.failed}`);

  const remaining = await prisma.outboxEvent.count({
    where: {
      eventType: 'ORDER_PLACED',
      status: 'PENDING',
      idempotencyKey: { startsWith: `outbox-${runBatchId}` },
    },
  });

  console.log(`   Remaining PENDING events: ${remaining}`);
  if (remaining !== 0) {
    throw new Error(`Expected all burst outbox events to be processed. Remaining: ${remaining}`);
  }

  console.log('\n🎉 ALL 60 CONCURRENT BURST TESTS PASSED 100%!');
  console.log('Zero overselling, zero lock deadlocks, zero cross-store double decrements.');
  console.log('======================================================');
}

runConcurrencyBurst()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ CONCURRENCY BURST TEST FAILED:', err);
    process.exit(1);
  });
