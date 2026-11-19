/**
 * MegaBachatMart — Real-Code Integration Test Suite
 * Directly imports and tests the live application source code:
 * - src/lib/shopPartnerStore.ts (real authentication, real CSV parser, real seed accounts)
 * - src/lib/ordersStore.ts (real order state machine, transitions, cancellation, cashback rules)
 * - src/lib/securityUtils.ts (real cryptographic HMAC webhook verification, real PII masking, real split payment)
 * - src/lib/catalog.ts (real live catalog items and stock)
 */

import { shopPartnerStore } from '../src/lib/shopPartnerStore.ts';
import { ordersStore, addOrder, updateOrderStatus, VALID_ORDER_TRANSITIONS } from '../src/lib/ordersStore.ts';
import { verifyWebhookSignature, maskPII, calculateSplitPayment, isCartAbandoned, processReturnRequest } from '../src/lib/securityUtils.ts';
import { getCatalogProducts } from '../src/lib/catalog.ts';
import crypto from 'crypto';

let totalTests = 0;
let passedTests = 0;
let expectedErrorsCaught = 0;
let failures = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    return true;
  } else {
    failures.push({ testIndex: totalTests, message });
    return false;
  }
}

function assertThrows(fn, expectedRegex, testName) {
  totalTests++;
  try {
    const result = fn();
    failures.push({
      testIndex: totalTests,
      message: `${testName}: Expected function to throw, but it returned successfully.`,
    });
    return false;
  } catch (err) {
    if (expectedRegex && !expectedRegex.test(err.message)) {
      failures.push({
        testIndex: totalTests,
        message: `${testName}: Threw error, but message "${err.message}" did not match regex ${expectedRegex}`,
      });
      return false;
    }
    expectedErrorsCaught++;
    passedTests++;
    return true;
  }
}

async function assertRejectsAsync(asyncFn, expectedRegex, testName) {
  totalTests++;
  try {
    await asyncFn();
    failures.push({
      testIndex: totalTests,
      message: `${testName}: Expected async function to reject, but it resolved successfully.`,
    });
    return false;
  } catch (err) {
    if (expectedRegex && !expectedRegex.test(err.message)) {
      failures.push({
        testIndex: totalTests,
        message: `${testName}: Rejected, but error "${err.message}" did not match regex ${expectedRegex}`,
      });
      return false;
    }
    expectedErrorsCaught++;
    passedTests++;
    return true;
  }
}

console.log('======================================================================');
console.log('🔥 MEGABACHATMART — REAL-CODE ARCHITECTURAL INTEGRATION SUITE');
console.log('Testing live application modules (NO MOCKS)');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// MODULE 1: Live Shop Partner Authentication (src/lib/shopPartnerStore.ts)
// -----------------------------------------------------------------------------
console.log('▶ [1/5] Testing REAL shopPartnerStore authentication & CSV engine...');

// 1A. Test real valid merchant login
const testShop = shopPartnerStore.authenticateShop('MBM-SHP-834001-23', 'MBM#Test001@2026');
assert(testShop !== null && testShop.ownerName === 'RAJ', 'Real shopPartnerStore: Valid Store ID authenticates RAJ');

// 1B. Test real phone login (with and without +91)
const phoneShop1 = shopPartnerStore.authenticateShop('9874561230', 'MBM#Test001@2026');
const phoneShop2 = shopPartnerStore.authenticateShop('+91 9874561230', 'MBM#Test001@2026');
assert(phoneShop1 !== null && phoneShop1.shopId === 'MBM-SHP-834001-23', 'Real shopPartnerStore: 10-digit phone login succeeds');
assert(phoneShop2 !== null && phoneShop2.shopId === 'MBM-SHP-834001-23', 'Real shopPartnerStore: +91 formatted phone login succeeds');

// 1C. Test real rejection on invalid passwords
const badPasswords = ['wrong_pass', '123456', 'MBM#Test001@wrong', 'mbm#test001@2026', 'admin123'];
for (let i = 0; i < badPasswords.length; i++) {
  const res = shopPartnerStore.authenticateShop('MBM-SHP-834001-23', badPasswords[i]);
  assert(res === null, `Real shopPartnerStore: Rejects bad password "${badPasswords[i]}"`);
}

// 1D. Test real rejection on SQL injections
const sqlInjections = ["' OR '1'='1", "admin' --", "'; DROP TABLE shops; --"];
for (let i = 0; i < sqlInjections.length; i++) {
  const res = shopPartnerStore.authenticateShop(sqlInjections[i], sqlInjections[i]);
  assert(res === null, `Real shopPartnerStore: Safely rejects SQL injection "${sqlInjections[i]}"`);
}

// 1E. Test real CSV Parser against live business rules
const validCsv = shopPartnerStore.generateSampleCsvTemplate();
const parsedValid = shopPartnerStore.parseCsvString(validCsv);
assert(parsedValid.errors.length === 0 && parsedValid.rows.length >= 5, 'Real shopPartnerStore: Parses valid CSV template without errors');

const invalidCsvMissingHeader = `productName,category,mrp\nSunflower Oil,Groceries,150`;
const parsedMissing = shopPartnerStore.parseCsvString(invalidCsvMissingHeader);
assert(parsedMissing.errors.length > 0 && parsedMissing.errors[0].includes('Missing mandatory column'), 'Real shopPartnerStore: Rejects CSV missing mandatory headers');

// -----------------------------------------------------------------------------
// MODULE 2: Live Order State Machine (src/lib/ordersStore.ts)
// -----------------------------------------------------------------------------
console.log('▶ [2/5] Testing REAL ordersStore state machine & lifecycle...');

const realOrder = addOrder({
  id: `ord-test-${Date.now()}`,
  orderNumber: `MBM-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
  userId: 'usr-real-1',
  userName: 'Test Customer',
  userPhone: '9874561230',
  deliveryAddress: 'Ranchi Central Main Road',
  pincode: '834001',
  status: 'PLACED',
  fulfilmentType: 'HOME_DELIVERY',
  deliveryOtp: '4567',
  paymentMethod: 'UPI',
  paymentStatus: 'PAID',
  totalMRP: 500,
  totalPayable: 420,
  shoppingSavings: 80,
  creditDeduction: 50,
  cashbackEarnable: 25,
  cashbackCredited: false,
  darkStore: { id: 'DS-01', name: 'Ranchi Central', city: 'Ranchi', etaMinutes: 20 },
  items: [],
  splitShipments: [],
  createdAt: new Date().toISOString(),
  timeline: [
    { step: 'Order Placed', time: '12:00 PM', completed: true },
    { step: 'Confirmed', time: '12:01 PM', completed: false },
    { step: 'Packed', time: '12:05 PM', completed: false },
    { step: 'Rider Assigned', time: '12:10 PM', completed: false },
    { step: 'Delivered', time: '12:20 PM', completed: false },
  ],
});

// 2A. Test illegal step-skipping: Cannot go directly from PLACED to DELIVERED
assertThrows(
  () => updateOrderStatus(realOrder.id, 'DELIVERED'),
  /Invalid state transition: Cannot transition order .* from "PLACED" to "DELIVERED"/,
  'Real ordersStore: Enforces state machine and blocks skipping steps (PLACED -> DELIVERED)'
);

// 2B. Test valid step-by-step transition
updateOrderStatus(realOrder.id, 'CONFIRMED');
assert(realOrder.status === 'CONFIRMED', 'Real ordersStore: Transitions PLACED -> CONFIRMED');

updateOrderStatus(realOrder.id, 'PACKED');
assert(realOrder.status === 'PACKED', 'Real ordersStore: Transitions CONFIRMED -> PACKED');

updateOrderStatus(realOrder.id, 'OUT_FOR_DELIVERY');
assert(realOrder.status === 'OUT_FOR_DELIVERY', 'Real ordersStore: Transitions PACKED -> OUT_FOR_DELIVERY');

updateOrderStatus(realOrder.id, 'DELIVERED');
assert(realOrder.status === 'DELIVERED', 'Real ordersStore: Transitions OUT_FOR_DELIVERY -> DELIVERED');
assert(realOrder.cashbackCredited === true, 'Real ordersStore: Credits cashback strictly upon DELIVERED');

// 2C. Test terminal state: Delivered orders cannot be cancelled
assertThrows(
  () => updateOrderStatus(realOrder.id, 'CANCELLED'),
  /Invalid state transition/,
  'Real ordersStore: Delivered orders are terminal and cannot be transitioned to CANCELLED'
);

// 2D. Test order cancellation & cashback reversal on unfulfilled order
const cancelTestOrder = addOrder({
  ...realOrder,
  id: `ord-cancel-${Date.now()}`,
  orderNumber: `MBM-CANCEL-${Math.floor(1000 + Math.random() * 9000)}`,
  status: 'CONFIRMED',
  cashbackEarnable: 30,
  cashbackCredited: false,
});
updateOrderStatus(cancelTestOrder.id, 'CANCELLED', 'Customer requested cancellation');
assert(cancelTestOrder.status === 'CANCELLED', 'Real ordersStore: Cancels confirmed order');
assert(cancelTestOrder.cashbackEarnable === 0 && cancelTestOrder.cashbackCredited === false, 'Real ordersStore: Reverses earnable cashback on cancellation');
assert(cancelTestOrder.refundStatus === 'PENDING', 'Real ordersStore: Initiates refund for paid order upon cancellation');

// -----------------------------------------------------------------------------
// MODULE 3: Live Cryptographic Webhook Security (src/lib/securityUtils.ts)
// -----------------------------------------------------------------------------
console.log('▶ [3/5] Testing REAL securityUtils cryptographic HMAC webhook verification...');

const secret = 'mbm_webhook_secret_key_2026';
const rawPayload = JSON.stringify({ orderNumber: 'MBM-TEST-999', status: 'SUCCESS' });
const validSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

// 3A. Valid signature
const isAuthentic = verifyWebhookSignature(rawPayload, validSignature, secret);
assert(isAuthentic === true, 'Real securityUtils: Validates genuine HMAC-SHA256 signature');

// 3B. Spoofed signature
const isSpoofed = verifyWebhookSignature(rawPayload, 'fake_forged_signature_token', secret);
assert(isSpoofed === false, 'Real securityUtils: Rejects forged/spoofed webhook signature');

// 3C. Tampered payload with original signature
const tamperedPayload = JSON.stringify({ orderNumber: 'MBM-TEST-999', status: 'SUCCESS', amount: 999999 });
const isTampered = verifyWebhookSignature(tamperedPayload, validSignature, secret);
assert(isTampered === false, 'Real securityUtils: Rejects signature when payload has been tampered');

// 3D. Missing signature
assert(verifyWebhookSignature(rawPayload, null, secret) === false, 'Real securityUtils: Rejects null signature');
assert(verifyWebhookSignature(rawPayload, undefined, secret) === false, 'Real securityUtils: Rejects undefined signature');

// -----------------------------------------------------------------------------
// MODULE 4: Live PII Masking & Split Payment (src/lib/securityUtils.ts)
// -----------------------------------------------------------------------------
console.log('▶ [4/5] Testing REAL securityUtils PII masking & split payments...');

// 4A. Phone masking
const maskedPhone = maskPII('Customer contacted with phone 9874561230');
assert(maskedPhone === 'Customer contacted with phone 98XXXX1230', 'Real securityUtils: Masks 10-digit Indian phone numbers');

// 4B. PAN masking
const maskedPan = maskPII('Merchant PAN is ABCDE1234F verified');
assert(maskedPan === 'Merchant PAN is ABCXXXX34F verified', 'Real securityUtils: Masks Indian PAN cards');

// 4C. Aadhaar masking while preserving Order IDs
const orderText = 'Processing order ORD-123456789012 for user';
assert(maskPII(orderText) === orderText, 'Real securityUtils: Preserves order IDs (ORD-123456789012) without over-masking');

const aadhaarText = 'Customer Aadhaar 2345 6789 0123 submitted';
assert(maskPII(aadhaarText) === 'Customer Aadhaar XXXX-XXXX-0123 submitted', 'Real securityUtils: Masks 12-digit Aadhaar cards');

// 4D. Email masking (multi-char and single-char edge cases)
assert(maskPII('user rahul.kumar@gmail.com logged in') === 'user r***r@gmail.com logged in', 'Real securityUtils: Masks standard email addresses');
assert(maskPII('user a@b.com logged in') === 'user a***@b.com logged in', 'Real securityUtils: Safely masks single-char local emails (a@b.com) without duplication');

// 4E. Split payment calculation (40% wallet cap)
const split1 = calculateSplitPayment(1000, 500, 1000); // 1000 total, 500 requested, 1000 balance -> max 40% = 400
assert(split1.walletDeducted === 400 && split1.gatewayPayable === 600, 'Real securityUtils: Enforces 40% wallet credit deduction cap');

const split2 = calculateSplitPayment(1000, 200, 1000); // 200 requested -> 200 deducted, 800 gateway
assert(split2.walletDeducted === 200 && split2.gatewayPayable === 800, 'Real securityUtils: Allows partial wallet credit below cap');

// 4F. Cart abandonment detection
const recentActivity = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
const oldActivity = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(); // 26 hours ago
assert(isCartAbandoned(recentActivity) === false, 'Real securityUtils: 2-hour idle cart is NOT abandoned');
assert(isCartAbandoned(oldActivity) === true, 'Real securityUtils: 26-hour idle cart IS marked abandoned');

// -----------------------------------------------------------------------------
// MODULE 5: Live Catalog Products (src/lib/catalog.ts)
// -----------------------------------------------------------------------------
console.log('▶ [5/5] Testing REAL catalog products & stock...');

const liveProducts = getCatalogProducts();
assert(liveProducts.length > 0, 'Real catalog: Returns live seeded product catalog');

const sunflowerOil = liveProducts.find((p) => p.id === 'p-1' || p.name.includes('Sunflower Oil'));
assert(sunflowerOil !== undefined, 'Real catalog: Sunflower oil product exists in live catalog');
assert(sunflowerOil.mrp > sunflowerOil.bachatPrice, 'Real catalog: Bachat price is strictly lower than MRP (savings guaranteed)');
assert(sunflowerOil.cashbackAmount > 0, 'Real catalog: Products feature active earnable cashback');

// -----------------------------------------------------------------------------
// SUMMARY & REPORT
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('📊 REAL-CODE INTEGRATION SUITE SUMMARY');
console.log('======================================================================');
console.log(`Total Live Invariant Tests : ${totalTests}`);
console.log(`Passed Real Invariants     : ${passedTests}`);
console.log(`Expected Errors Caught     : ${expectedErrorsCaught}`);
console.log(`Real Code Failures         : ${failures.length}`);

if (failures.length > 0) {
  console.log('\n❌ REAL APPLICATION CODE DEFECTS FOUND:');
  failures.forEach((f) => console.log(`  [Test #${f.testIndex}] ${f.message}`));
} else {
  console.log('\n✨ ALL LIVE APPLICATION MODULES PASSED WITH 100% REAL-CODE INTEGRITY!');
}
console.log('======================================================================\n');
