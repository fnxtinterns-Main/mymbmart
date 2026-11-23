-- DropForeignKey
ALTER TABLE "LedgerJournalLine" DROP CONSTRAINT "LedgerJournalLine_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "RefundRecord" DROP CONSTRAINT "RefundRecord_settlementId_fkey";

-- AddForeignKey
ALTER TABLE "LedgerJournalLine" ADD CONSTRAINT "LedgerJournalLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
