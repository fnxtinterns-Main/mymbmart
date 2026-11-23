-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sumDebitsPaise" INTEGER NOT NULL,
    "sumCreditsPaise" INTEGER NOT NULL,
    "isBalanced" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerJournalLine" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "debitPaise" INTEGER NOT NULL DEFAULT 0,
    "creditPaise" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LedgerJournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "settlementId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "cumulativeRefundedPaise" INTEGER NOT NULL,
    "reversedMerchantPaise" INTEGER NOT NULL,
    "reversedPlatformPaise" INTEGER NOT NULL,
    "reversedTdsPaise" INTEGER NOT NULL,
    "gatewayRefundPaise" INTEGER NOT NULL,
    "walletRefundPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_idempotencyKey_key" ON "LedgerTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LedgerTransaction_orderId_idx" ON "LedgerTransaction"("orderId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_transactionType_idx" ON "LedgerTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "LedgerTransaction_createdAt_idx" ON "LedgerTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerJournalLine_transactionId_idx" ON "LedgerJournalLine"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerJournalLine_account_idx" ON "LedgerJournalLine"("account");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_refundId_key" ON "RefundRecord"("refundId");

-- CreateIndex
CREATE INDEX "RefundRecord_orderId_idx" ON "RefundRecord"("orderId");

-- CreateIndex
CREATE INDEX "RefundRecord_settlementId_idx" ON "RefundRecord"("settlementId");

-- CreateIndex
CREATE INDEX "RefundRecord_createdAt_idx" ON "RefundRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- AddForeignKey
ALTER TABLE "LedgerJournalLine" ADD CONSTRAINT "LedgerJournalLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "LedgerTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

