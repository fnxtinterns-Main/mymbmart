/**
 * MegaBachatMart — Cloud Infrastructure Live Verification Script
 * Tests:
 * 1. AWS EC2 PostgreSQL (13.205.112.255:5432) via Prisma
 * 2. Upstash Redis (AWS Mumbai ap-south-1) via Native REST
 * 3. End-to-end sync between Database, Redis, and Application Store
 */

import { PrismaClient } from '@prisma/client';
import { redisCommand, redisGet, redisSet, isRedisConfigured } from '../src/lib/redis.ts';

const prisma = new PrismaClient();

async function runTests() {
  console.log('======================================================================');
  console.log('🚀 MEGABACHATMART — LIVE CLOUD INFRASTRUCTURE DIAGNOSTIC TEST');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${title} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
    }
  }

  // ------------------------------------------------------------------
  // 1. UPSTASH REDIS TESTS (AWS Mumbai ap-south-1)
  // ------------------------------------------------------------------
  console.log('▶ [1/3] Testing Upstash Redis (AWS Mumbai ap-south-1)...');
  const t0Redis = Date.now();
  assert('Redis Configured in Environment', isRedisConfigured());

  try {
    const pong = await redisCommand('ping');
    const latencyRedis = Date.now() - t0Redis;
    assert('Redis PING', pong === 'PONG', `Response: ${pong}, Latency: ${latencyRedis}ms`);

    // Write & Read Test Key with TTL
    const testKey = `test:healthcheck:${Date.now()}`;
    const testPayload = { status: 'OK', timestamp: new Date().toISOString(), platform: 'MegaBachatMart' };
    const setResult = await redisSet(testKey, testPayload, 60);
    assert('Redis SET with 60s TTL', setResult === true);

    const getResult = await redisGet(testKey);
    assert('Redis GET roundtrip', getResult?.platform === 'MegaBachatMart', `Payload verified`);

    // Verify Latest Orders in Redis
    const cachedOrders = await redisGet('orders:latest');
    assert('Redis orders:latest cache exists', Array.isArray(cachedOrders) && cachedOrders.length > 0, `Cached Orders: ${cachedOrders?.length || 0}`);
    if (cachedOrders?.length > 0) {
      console.log(`     ℹ️  Latest cached order: #${cachedOrders[0].orderNumber} (₹${cachedOrders[0].totalPayable})`);
    }

    // Cleanup test key
    await redisCommand('del', testKey);
  } catch (err) {
    assert('Redis Connectivity', false, err.message);
  }

  console.log('');

  // ------------------------------------------------------------------
  // 2. AWS EC2 POSTGRESQL TESTS (13.205.112.255:5432)
  // ------------------------------------------------------------------
  console.log('▶ [2/3] Testing AWS EC2 PostgreSQL (13.205.112.255:5432)...');
  const t0Db = Date.now();

  try {
    // Test raw query
    const rawResult = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    const latencyDb = Date.now() - t0Db;
    assert('PostgreSQL Connection & Handshake', rawResult?.length > 0, `Latency: ${latencyDb}ms`);
    if (rawResult?.length > 0) {
      const dbInfo = rawResult[0];
      console.log(`     ℹ️  PostgreSQL User: ${dbInfo.current_user} | Database: ${dbInfo.current_database}`);
    }

    // Test Schema Tables
    const storeCount = await prisma.store.count();
    assert('Prisma Schema Stores Table accessible', typeof storeCount === 'number', `Current Stores: ${storeCount}`);

    const userCount = await prisma.user.count();
    assert('Prisma Schema Users Table accessible', typeof userCount === 'number', `Current Users: ${userCount}`);

    const orderCount = await prisma.order.count();
    assert('Prisma Schema Orders Table accessible', typeof orderCount === 'number', `Current Orders: ${orderCount}`);

    // CRUD Invariant Test
    const testMemberId = `TEST-MEMBER-${Date.now()}`;
    const testPhone = `9999${String(Date.now()).slice(-6)}`;
    const testUser = await prisma.user.create({
      data: {
        memberId: testMemberId,
        name: 'Cloud Verification User',
        phone: testPhone,
        referralCode: `REF-${Date.now()}`,
        role: 'CUSTOMER',
      },
    });
    assert('PostgreSQL User Creation (INSERT)', Boolean(testUser?.id), `User ID: ${testUser.id}`);

    // Read back
    const fetchedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert('PostgreSQL User Retrieval (SELECT)', fetchedUser?.phone === testPhone);

    // Cleanup test user
    await prisma.user.delete({ where: { id: testUser.id } });
    assert('PostgreSQL User Cleanup (DELETE)', true);

  } catch (err) {
    assert('PostgreSQL Operations', false, err.message);
  }

  console.log('');

  // ------------------------------------------------------------------
  // 3. INTEGRATION PIPELINE TEST (Store Sync)
  // ------------------------------------------------------------------
  console.log('▶ [3/3] Testing Unified Storefront Sync Layer...');
  try {
    const { syncOrdersFromRedis } = await import('../src/lib/ordersStore.ts');
    const syncedOrders = await syncOrdersFromRedis();
    assert('Sync Orders from Redis + Local Disk', Array.isArray(syncedOrders) && syncedOrders.length > 0, `Total Orders in Store: ${syncedOrders.length}`);
    if (syncedOrders.length > 0) {
      console.log(`     ℹ️  Synced Order 1: ${syncedOrders[0].orderNumber} (${syncedOrders[0].status}) - ₹${syncedOrders[0].totalPayable}`);
    }
  } catch (err) {
    assert('Sync Storefront Orders', false, err.message);
  }

  console.log('\n======================================================================');
  console.log(`📊 CLOUD INFRASTRUCTURE VERIFICATION SUMMARY: ${passed}/${total} PASSED`);
  if (passed === total) {
    console.log('🎉 ALL CLOUD SYSTEMS (AWS POSTGRESQL + UPSTASH REDIS) OPERATIONAL!');
  } else {
    console.log('⚠️ SOME INVARIANTS FAILED. Check details above.');
  }
  console.log('======================================================================\n');

  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error('Test runner encountered fatal error:', e);
  process.exit(1);
});
