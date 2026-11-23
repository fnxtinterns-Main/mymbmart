import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n======================================================');
  console.log('🔍 PRODUCTION DATABASE MIGRATION VERIFICATION AUDIT');
  console.log('Target: AWS EC2 PostgreSQL (13.205.112.255:5432 / mymbmart)');
  console.log('======================================================\n');

  console.log('▶ [1/5] Querying "_prisma_migrations" table:');
  const migrations = await prisma.$queryRawUnsafe(`
    SELECT migration_name, started_at, finished_at, rolled_back_at 
    FROM "_prisma_migrations" 
    ORDER BY started_at ASC;
  `);
  console.table(migrations);

  console.log('▶ [2/5] Querying "information_schema.tables":');
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('LedgerTransaction', 'LedgerJournalLine', 'RefundRecord', 'OutboxEvent') 
    ORDER BY table_name;
  `);
  console.table(tables);

  console.log('▶ [3/5] Querying table row counts:');
  const counts = await prisma.$queryRawUnsafe(`
    SELECT 'LedgerTransaction' AS table_name, COUNT(*)::int AS total FROM public."LedgerTransaction"
    UNION ALL
    SELECT 'LedgerJournalLine', COUNT(*)::int FROM public."LedgerJournalLine"
    UNION ALL
    SELECT 'RefundRecord', COUNT(*)::int FROM public."RefundRecord"
    UNION ALL
    SELECT 'OutboxEvent', COUNT(*)::int FROM public."OutboxEvent";
  `);
  console.table(counts);

  console.log('▶ [4/5] Querying indexes from "pg_indexes":');
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename IN ('LedgerTransaction', 'LedgerJournalLine', 'RefundRecord', 'OutboxEvent') 
    ORDER BY tablename, indexname;
  `);
  console.table(indexes);

  console.log('▶ [5/5] Querying constraints from "information_schema.table_constraints":');
  const constraints = await prisma.$queryRawUnsafe(`
    SELECT table_name, constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name IN ('LedgerTransaction', 'LedgerJournalLine', 'RefundRecord', 'OutboxEvent') 
    ORDER BY table_name, constraint_type;
  `);
  console.table(constraints);

  console.log('✅ ALL PRODUCTION POSTGRESQL CHECKS COMPLETE!\n');
}

main()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
