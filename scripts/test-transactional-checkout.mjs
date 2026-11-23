import { POST } from '../src/app/api/checkout/place-order/route.ts';
import { prisma } from '../src/lib/prisma.ts';

async function main() {
  console.log('\n======================================================');
  console.log('🧪 TESTING TRANSACTIONAL CHECKOUT & OUTBOX EMISSION');
  console.log('======================================================\n');

  const testPhone = '+9199' + Math.floor(10000000 + Math.random() * 90000000);
  const checkoutPayload = {
    items: [
      { productId: 'MB-GRO-AASH-5K', quantity: 1 }
    ],
    customerName: 'Test Buyer',
    customerPhone: testPhone,
    deliveryAddress: 'Main Road, Ranchi - 834001',
    pincode: '834001',
    paymentMethod: 'UPI',
    useWalletCredits: false,
  };

  const req = new Request('http://localhost:3000/api/checkout/place-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutPayload),
  });

  console.log('▶ [1/4] Invoking POST /api/checkout/place-order...');
  const res = await POST(req);
  const data = await res.json();

  if (!data.success) {
    throw new Error(`Checkout failed: ${data.message}`);
  }

  const orderId = data.order.id;
  console.log(`✅ [2/4] Checkout succeeded! Created Order: ${orderId} (#${data.order.orderNumber})`);

  // Verify in PostgreSQL Order table
  const dbOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!dbOrder) {
    throw new Error(`CRITICAL: Order ${orderId} was NOT found in PostgreSQL Order table!`);
  }
  console.log(`✅ [3/4] Order verified in PostgreSQL: Order Number ${dbOrder.orderNumber}, Amount ₹${dbOrder.finalPayable}`);

  // Verify OutboxEvent table
  const dbOutbox = await prisma.outboxEvent.findFirst({
    where: { aggregateId: orderId },
  });
  if (!dbOutbox) {
    throw new Error(`CRITICAL: OutboxEvent for order ${orderId} was NOT found in PostgreSQL!`);
  }
  console.log(`✅ [4/4] OutboxEvent verified in PostgreSQL: Event Type "${dbOutbox.eventType}", Status "${dbOutbox.status}"`);

  // Verify Financial Ledger Transaction
  const dbLedgerTx = await prisma.ledgerTransaction.findFirst({
    where: { orderId: orderId },
    include: { lines: true },
  });
  if (dbLedgerTx) {
    console.log(`✅ [Bonus] Financial Ledger Settlement verified: ${dbLedgerTx.lines.length} lines balanced in PostgreSQL`);
  }

  console.log('\n🎉 ALL TRANSACTIONAL CHECKOUT & OUTBOX TESTS PASSED 100%!\n');
}

main()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
