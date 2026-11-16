/**
 * MEGA BACHAT MART – Phase 11 Comprehensive Automated Integration & QA Test Suite
 * Tests all 14 core API endpoints and end-to-end commerce flows
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🚀 MEGA BACHAT MART – E2E INTEGRATION & QA TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error('   Error:', err.message);
      failed++;
    }
  }

  // 1. Serviceability
  await test('POST /api/location/serviceability (Ranchi Dark Store)', async () => {
    const res = await fetch(`${BASE_URL}/api/location/serviceability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: '834001' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.store) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
  });

  // 2. Catalog
  await test('GET /api/products (Dual-Commerce Catalog)', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    if (!res.ok || !data.success || data.totalCount === 0) {
      throw new Error('Product catalog empty or failed');
    }
  });

  // 3. Auth OTP Send
  await test('POST /api/auth/otp (Send OTP)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+919876543210', action: 'SEND' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`OTP send failed: ${JSON.stringify(data)}`);
    }
  });

  // 4. Auth OTP Verify
  await test('POST /api/auth/otp (Verify OTP & Issue JWT)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+919876543210', action: 'VERIFY', otp: '123456' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.token || !data.user) {
      throw new Error(`OTP verification failed: ${JSON.stringify(data)}`);
    }
  });

  // 5. Checkout Preview
  await test('POST /api/checkout/preview (Split Shipments & Pricing)', async () => {
    const res = await fetch(`${BASE_URL}/api/checkout/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p-1', quantity: 2 }, { productId: 'p-8', quantity: 1 }],
        pincode: '834001',
        useWalletCredits: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.pricing) {
      throw new Error('Preview calculation failed');
    }
  });

  // 6. Place Order
  let placedOrderNumber = '';
  let placedOrderId = '';
  let deliveryOtp = '';

  await test('POST /api/checkout/place-order (Order Creation & Delivery OTP)', async () => {
    const res = await fetch(`${BASE_URL}/api/checkout/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p-3', quantity: 1 }, { productId: 'p-6', quantity: 1 }],
        deliveryAddress: 'Main Road, Ranchi Central - 834001',
        pincode: '834001',
        paymentMethod: 'UPI',
        customerName: 'Test Customer',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.order) {
      throw new Error(`Order placement failed: ${JSON.stringify(data)}`);
    }
    placedOrderId = data.order.id;
    placedOrderNumber = data.order.orderNumber;
    deliveryOtp = data.order.deliveryOtp;
  });

  // 7. Store Pack Order
  await test('POST /api/store/orders (Store Manager: Pack Order)', async () => {
    const res = await fetch(`${BASE_URL}/api/store/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: placedOrderId, action: 'PACK' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error('Store pack action failed');
    }
  });

  // 8. Store Dispatch Rider
  await test('POST /api/store/orders (Store Manager: Dispatch Rider)', async () => {
    const res = await fetch(`${BASE_URL}/api/store/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: placedOrderId, action: 'DISPATCH' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error('Rider dispatch failed');
    }
  });

  // 9. Rider Verify Delivery OTP
  await test('POST /api/rider/verify-delivery (Doorstep Delivery & SmartChain Hash)', async () => {
    const res = await fetch(`${BASE_URL}/api/rider/verify-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: placedOrderId, deliveryOtp: deliveryOtp }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.settlement.smartChainProofHash) {
      throw new Error(`Delivery verification failed: ${JSON.stringify(data)}`);
    }
  });

  // 10. Savings Passbook
  await test('GET /api/savings (Passbook & Ledger)', async () => {
    const res = await fetch(`${BASE_URL}/api/savings`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.wallet) {
      throw new Error('Savings fetch failed');
    }
  });

  // 11. Promoter Team Tree
  await test('GET /api/promoter/team (3-Tier Downline Tree)', async () => {
    const res = await fetch(`${BASE_URL}/api/promoter/team`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.tree) {
      throw new Error('Team tree fetch failed');
    }
  });

  // 12. SHG Producer Register
  await test('POST /api/producer/register (SHG Self-Onboarding)', async () => {
    const res = await fetch(`${BASE_URL}/api/producer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Pratibha Mahila Samuh',
        category: 'SHG',
        contactPerson: 'Pratibha Devi',
        phone: '+91 94318 22114',
        city: 'Ranchi',
        productDescription: 'Handmade Spices and Mustard Oil',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error('Producer onboarding failed');
    }
  });

  // 13. SmartChain Explorer
  await test('GET /api/smartchain/explorer (PoA Merkle Blocks)', async () => {
    const res = await fetch(`${BASE_URL}/api/smartchain/explorer`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.recentBlocks) {
      throw new Error('SmartChain explorer failed');
    }
  });

  // 14. Admin Operations Metrics
  await test('GET /api/admin/metrics (KPIs & Dark Store Health)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/metrics`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.kpis) {
      throw new Error('Admin metrics failed');
    }
  });

  console.log('\n===============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
