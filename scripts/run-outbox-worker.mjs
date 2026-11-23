import { outboxWorker } from '../src/lib/outboxWorker.ts';

console.log('🚀 Starting MegaBachatMart Outbox Worker Daemon...');
console.log('PID:', process.pid);

const ac = new AbortController();

process.on('SIGINT', () => {
  console.log('\nStopping outbox worker gracefully...');
  ac.abort();
});
process.on('SIGTERM', () => {
  console.log('\nStopping outbox worker gracefully...');
  ac.abort();
});

await outboxWorker.startDaemon({
  intervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS || 3000),
  batchSize: 10,
  abortSignal: ac.signal,
});

console.log('Outbox worker daemon stopped.');
process.exit(0);
