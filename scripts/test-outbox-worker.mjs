import { OutboxWorkerService } from '../src/lib/outboxWorker.ts';
import { prisma } from '../src/lib/prisma.ts';

async function main() {
  console.log('\n======================================================');
  console.log('⚙️ TESTING TRANSACTIONAL OUTBOX WORKER & LOCKING');
  console.log('Target: AWS EC2 PostgreSQL (13.205.112.255:5432 / mymbmart)');
  console.log('======================================================\n');

  const workerA = new OutboxWorkerService({ workerId: 'test-worker-alpha', maxRetries: 3 });
  const workerB = new OutboxWorkerService({ workerId: 'test-worker-beta', maxRetries: 3 });

  // 1. Seed 4 test outbox events
  const batchId = Date.now();
  console.log('▶ [1/5] Seeding test OutboxEvents in PostgreSQL...');
  const eventKeys = [
    `test-evt-1-${batchId}`,
    `test-evt-2-${batchId}`,
    `test-evt-3-${batchId}`,
    `test-evt-4-${batchId}`,
  ];

  for (let i = 0; i < eventKeys.length; i++) {
    await prisma.outboxEvent.create({
      data: {
        aggregateType: 'ORDER',
        aggregateId: `test-order-${batchId}-${i + 1}`,
        eventType: i === 3 ? 'FAIL_TEST_EVENT' : 'ORDER_PLACED',
        payload: { testIndex: i + 1, batchId },
        idempotencyKey: eventKeys[i],
        status: 'PENDING',
      },
    });
  }
  console.log(`✅ Seeded ${eventKeys.length} pending events.`);

  // 2. Test Concurrent SKIP LOCKED Claiming
  console.log('▶ [2/5] Testing Concurrent SKIP LOCKED Claiming (Worker Alpha & Beta)...');
  const [claimedA, claimedB] = await Promise.all([
    workerA.claimBatch(2),
    workerB.claimBatch(2),
  ]);

  console.log(`   Worker Alpha claimed ${claimedA.length} events: [${claimedA.map(e => e.id).join(', ')}]`);
  console.log(`   Worker Beta claimed ${claimedB.length} events: [${claimedB.map(e => e.id).join(', ')}]`);

  // Verify non-overlapping claims
  const idsA = new Set(claimedA.map(e => e.id));
  const overlap = claimedB.filter(e => idsA.has(e.id));
  if (overlap.length > 0) {
    throw new Error(`CRITICAL: Worker Alpha and Beta claimed overlapping events: ${overlap.map(e => e.id).join(', ')}`);
  }
  console.log('✅ PASS: Zero lock contention. Workers claimed completely non-overlapping events.');

  // 3. Process events & verify COMPLETED state
  console.log('▶ [3/5] Processing normal events...');
  for (const event of [...claimedA, ...claimedB]) {
    if (event.eventType !== 'FAIL_TEST_EVENT') {
      const res = await workerA.processEvent(event);
      if (!res.success) {
        throw new Error(`Processing failed for event ${event.id}: ${res.error}`);
      }

      const updated = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
      if (updated?.status !== 'COMPLETED' || !updated.processedAt) {
        throw new Error(`Event ${event.id} was not marked COMPLETED in PostgreSQL!`);
      }
    }
  }
  console.log('✅ PASS: Successfully processed and transitioned events to COMPLETED.');

  // 4. Test Error Handling & Dead-Letter (FAIL_TEST_EVENT)
  console.log('▶ [4/5] Testing Failure Retries and Dead-Lettering...');
  workerA.registerHandler('FAIL_TEST_EVENT', async () => {
    throw new Error('SIMULATED_DOWNSTREAM_HTTP_500');
  });

  const failEventRecord = await prisma.outboxEvent.findUnique({
    where: { idempotencyKey: eventKeys[3] },
  });

  if (!failEventRecord) throw new Error('Missing fail event record');

  // Trigger retry 1
  await workerA.processEvent(failEventRecord);
  let retry1 = await prisma.outboxEvent.findUnique({ where: { id: failEventRecord.id } });
  if (retry1?.retryCount !== 1 || retry1.status !== 'PENDING') {
    throw new Error(`Expected retryCount 1 and status PENDING, got ${retry1?.retryCount} / ${retry1?.status}`);
  }

  // Trigger retry 2
  await workerA.processEvent(retry1);
  let retry2 = await prisma.outboxEvent.findUnique({ where: { id: failEventRecord.id } });
  if (retry2?.retryCount !== 2 || retry2.status !== 'PENDING') {
    throw new Error(`Expected retryCount 2 and status PENDING, got ${retry2?.retryCount} / ${retry2?.status}`);
  }

  // Trigger retry 3 (exceeds maxRetries 3 -> Dead-Letter)
  await workerA.processEvent(retry2);
  let deadLetter = await prisma.outboxEvent.findUnique({ where: { id: failEventRecord.id } });
  if (deadLetter?.status !== 'FAILED' || !deadLetter.processedAt) {
    throw new Error(`Expected event to be dead-lettered with status FAILED, got ${deadLetter?.status}`);
  }
  console.log(`✅ PASS: Event failed 3 times and correctly dead-lettered to status "FAILED".`);

  // 5. Test Abandoned Lock Recovery
  console.log('▶ [5/5] Testing Abandoned Lock Recovery...');
  const abandonedKey = `abandoned-evt-${batchId}`;
  await prisma.outboxEvent.create({
    data: {
      aggregateType: 'ORDER',
      aggregateId: `order-abandoned-${batchId}`,
      eventType: 'ORDER_PLACED',
      payload: { abandoned: true },
      idempotencyKey: abandonedKey,
      status: 'PROCESSING',
      lockedBy: 'crashed-worker-999',
      lockedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
  });

  const recovered = await workerA.claimBatch(50);
  console.log(`   Claimed ${recovered.length} events during recovery test.`);
  const foundAbandoned = recovered.find(e => e.idempotencyKey === abandonedKey);
  if (!foundAbandoned) {
    const rawCheck = await prisma.outboxEvent.findUnique({ where: { idempotencyKey: abandonedKey } });
    console.log(`   Raw check in DB for abandoned event:`, rawCheck);
    throw new Error('Worker failed to recover abandoned locked event!');
  }
  if (!foundAbandoned) {
    throw new Error('Worker failed to recover abandoned locked event!');
  }
  if (foundAbandoned.lockedBy !== 'test-worker-alpha') {
    throw new Error(`Expected lock to be stolen by test-worker-alpha, found: ${foundAbandoned.lockedBy}`);
  }

  await workerA.processEvent(foundAbandoned);
  const recoveredCompleted = await prisma.outboxEvent.findUnique({ where: { idempotencyKey: abandonedKey } });
  if (recoveredCompleted?.status !== 'COMPLETED') {
    throw new Error('Recovered event was not marked COMPLETED!');
  }
  console.log('✅ PASS: Abandoned event recovered and completed successfully.');

  console.log('\n🎉 ALL OUTBOX WORKER CONCURRENCY & RECOVERY TESTS PASSED 100%!\n');
}

main()
  .catch((err) => {
    console.error('❌ Outbox test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
