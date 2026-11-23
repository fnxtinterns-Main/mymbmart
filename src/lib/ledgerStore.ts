/**
 * MegaBachatMart — Double-Entry Financial Ledger (V5.3.2)
 * Single source of truth for financial transactions, partner settlements, statutory Section 194-O TDS, and partial refunds.
 * Invariant: Sum of Debits MUST ALWAYS equal Sum of Credits for every journal entry.
 * Invariant: Cumulative partial refunds for an order MUST NOT exceed original order gross amount.
 * Persistence: Fully backed by AWS PostgreSQL via Prisma with row locking, strict integer paise arithmetic,
 * and database-enforced unique idempotency keys.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type LedgerAccount =
  | 'CUSTOMER_RECEIVABLE'
  | 'GATEWAY_CLEARING'
  | 'WALLET_LIABILITY'
  | 'MERCHANT_PAYABLE'
  | 'PLATFORM_REVENUE'
  | 'TDS_PAYABLE_GOVT'
  | 'REFUND_CLEARING';

export interface JournalLine {
  account: LedgerAccount;
  debitPaise: number;
  creditPaise: number;
}

export interface JournalEntry {
  id: string;
  orderId: string;
  idempotencyKey?: string;
  transactionType: 'ORDER_SETTLEMENT' | 'ORDER_REFUND' | 'COMMISSION_PAYOUT';
  description: string;
  lines: JournalLine[];
  sumDebitsPaise: number;
  sumCreditsPaise: number;
  isBalanced: boolean;
  createdAt: string;
}

export interface StoredRefundRecord {
  id: string;
  orderId: string;
  refundId: string;
  settlementId?: string | null;
  amountPaise: number;
  cumulativeRefundedPaise: number;
  reversedMerchantPaise: number;
  reversedPlatformPaise: number;
  reversedTdsPaise: number;
  gatewayRefundPaise: number;
  walletRefundPaise: number;
  status: string;
  createdAt: string;
}

// Helper to format Prisma LedgerTransaction into application JournalEntry
function toJournalEntry(tx: {
  id: string;
  orderId: string;
  transactionType: string;
  idempotencyKey: string;
  description: string;
  sumDebitsPaise: number;
  sumCreditsPaise: number;
  isBalanced: boolean;
  createdAt: Date;
  lines?: Array<{ account: string; debitPaise: number; creditPaise: number }>;
}): JournalEntry {
  const lines: JournalLine[] = (tx.lines || []).map((l) => ({
    account: l.account as LedgerAccount,
    debitPaise: l.debitPaise,
    creditPaise: l.creditPaise,
  }));
  Object.freeze(lines);
  return Object.freeze({
    id: tx.id,
    orderId: tx.orderId,
    idempotencyKey: tx.idempotencyKey,
    transactionType: tx.transactionType as JournalEntry['transactionType'],
    description: tx.description,
    lines,
    sumDebitsPaise: tx.sumDebitsPaise,
    sumCreditsPaise: tx.sumCreditsPaise,
    isBalanced: tx.isBalanced,
    createdAt: tx.createdAt.toISOString(),
  });
}

export class FinancialLedgerStore {
  // Fail-closed validation: PostgreSQL is strictly mandatory
  public assertProductionDatabaseConfigured(): void {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is missing. Financial ledger operations require a live PostgreSQL database.');
    }
  }

  /**
   * Record order settlement with split payment validation, integer paise precision,
   * Section 194-O TDS liability, and database-enforced idempotency.
   */
  public async recordOrderSettlement(
    params: {
      orderId: string;
      grossAmount: number;
      walletPaid: number;
      gatewayPaid: number;
      commissionRate?: number;
      tdsRate?: number;
      idempotencyKey?: string;
    },
    txClient?: Prisma.TransactionClient
  ): Promise<JournalEntry> {
    this.assertProductionDatabaseConfigured();

    const {
      orderId,
      grossAmount,
      walletPaid,
      gatewayPaid,
      commissionRate = 0.10,
      tdsRate = Number(process.env.SECTION_194O_TDS_RATE || 0.01),
      idempotencyKey = `settle-${orderId}`,
    } = params;

    // Strict numerical and sanity validations
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Valid orderId is required for order settlement.');
    }
    if (!Number.isFinite(grossAmount) || grossAmount < 0) {
      throw new Error(`Invalid grossAmount: ${grossAmount}. Must be a non-negative finite number.`);
    }
    if (!Number.isFinite(walletPaid) || walletPaid < 0) {
      throw new Error(`Invalid walletPaid: ${walletPaid}. Must be a non-negative finite number.`);
    }
    if (!Number.isFinite(gatewayPaid) || gatewayPaid < 0) {
      throw new Error(`Invalid gatewayPaid: ${gatewayPaid}. Must be a non-negative finite number.`);
    }
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      throw new Error(`Invalid commissionRate: ${commissionRate}. Must be between 0.0 and 1.0.`);
    }
    if (!Number.isFinite(tdsRate) || tdsRate < 0 || tdsRate > 1) {
      throw new Error(`Invalid tdsRate: ${tdsRate}. Must be between 0.0 and 1.0.`);
    }

    const grossPaise = Math.round(grossAmount * 100);
    const walletPaise = Math.round(walletPaid * 100);
    const gatewayPaise = Math.round(gatewayPaid * 100);

    if (!Number.isSafeInteger(grossPaise) || !Number.isSafeInteger(walletPaise) || !Number.isSafeInteger(gatewayPaise)) {
      throw new Error('Monetary amounts exceed safe integer paise limit.');
    }

    // Invariant: payment components MUST equal gross order amount
    if (walletPaise + gatewayPaise !== grossPaise) {
      throw new Error(`Payment components (${walletPaise} + ${gatewayPaise} paise) do not equal gross order amount (${grossPaise} paise).`);
    }

    const tdsPaise = Math.round(grossPaise * tdsRate);
    const commPaise = Math.round(grossPaise * commissionRate);
    const merchantNetPaise = grossPaise - commPaise - tdsPaise;

    if (merchantNetPaise < 0) {
      throw new Error(`Commission and TDS deductions (${commPaise + tdsPaise} paise) exceed gross order amount (${grossPaise} paise).`);
    }

    const lines: JournalLine[] = [
      // Debits (Assets received / liabilities settled)
      { account: 'GATEWAY_CLEARING', debitPaise: gatewayPaise, creditPaise: 0 },
      { account: 'WALLET_LIABILITY', debitPaise: walletPaise, creditPaise: 0 },
      // Credits (Liabilities incurred / revenue recognized)
      { account: 'MERCHANT_PAYABLE', debitPaise: 0, creditPaise: merchantNetPaise },
      { account: 'PLATFORM_REVENUE', debitPaise: 0, creditPaise: commPaise },
      { account: 'TDS_PAYABLE_GOVT', debitPaise: 0, creditPaise: tdsPaise },
    ];

    const sumDebitsPaise = lines.reduce((sum, l) => sum + l.debitPaise, 0);
    const sumCreditsPaise = lines.reduce((sum, l) => sum + l.creditPaise, 0);
    const isBalanced = sumDebitsPaise === sumCreditsPaise;

    if (!isBalanced) {
      throw new Error(`Unbalanced journal entry for ${orderId}: Debits (${sumDebitsPaise}) !== Credits (${sumCreditsPaise})`);
    }

    // Execute in caller's transaction or start a dedicated transaction
    const executeInTx = async (tx: Prisma.TransactionClient): Promise<JournalEntry> => {
      // 1. Check if transaction already exists (Idempotency)
      const existing = await tx.ledgerTransaction.findFirst({
        where: {
          OR: [
            { idempotencyKey },
            { orderId, transactionType: 'ORDER_SETTLEMENT' },
          ],
        },
        include: { lines: true },
      });
      if (existing) {
        return toJournalEntry(existing);
      }

      // 2. Persist header and lines atomically
      try {
        const created = await tx.ledgerTransaction.create({
          data: {
            orderId,
            transactionType: 'ORDER_SETTLEMENT',
            idempotencyKey,
            description: `Settlement for order ${orderId} (TDS: ${(tdsRate * 100).toFixed(1)}%)`,
            sumDebitsPaise,
            sumCreditsPaise,
            isBalanced: true,
            lines: {
              create: lines.map((l) => ({
                account: l.account,
                debitPaise: l.debitPaise,
                creditPaise: l.creditPaise,
              })),
            },
          },
          include: { lines: true },
        });
        return toJournalEntry(created);
      } catch (err: any) {
        // Handle concurrent unique key race condition
        if (err.code === 'P2002') {
          const raceExisting = await tx.ledgerTransaction.findUnique({
            where: { idempotencyKey },
            include: { lines: true },
          });
          if (raceExisting) return toJournalEntry(raceExisting);
        }
        throw err;
      }
    };

    if (txClient) {
      return executeInTx(txClient);
    }
    return prisma.$transaction(executeInTx);
  }

  /**
   * Record refund reversal contra-entry with row locking, cumulative multi-refund tracking,
   * rounding drift prevention, and Section 194-O TDS reversal.
   */
  public async recordRefundReversal(
    params: {
      orderId: string;
      gatewayRefund: number;
      walletRefund: number;
      refundId?: string;
    },
    txClient?: Prisma.TransactionClient
  ): Promise<JournalEntry> {
    this.assertProductionDatabaseConfigured();

    const {
      orderId,
      gatewayRefund,
      walletRefund,
      refundId = `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    } = params;

    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Valid orderId is required for refund reversal.');
    }
    if (!Number.isFinite(gatewayRefund) || gatewayRefund < 0) {
      throw new Error(`Invalid gatewayRefund: ${gatewayRefund}. Must be non-negative.`);
    }
    if (!Number.isFinite(walletRefund) || walletRefund < 0) {
      throw new Error(`Invalid walletRefund: ${walletRefund}. Must be non-negative.`);
    }

    const gatewayPaise = Math.round(gatewayRefund * 100);
    const walletPaise = Math.round(walletRefund * 100);
    const totalRefundPaise = gatewayPaise + walletPaise;

    if (!Number.isSafeInteger(totalRefundPaise) || totalRefundPaise <= 0) {
      throw new Error(`Total refund must be greater than zero paise. Received: ${totalRefundPaise} paise.`);
    }

    const executeInTx = async (tx: Prisma.TransactionClient): Promise<JournalEntry> => {
      // 1. Idempotency check: Duplicate refund callback for the same refundId returns existing entry
      const existingRefund = await tx.ledgerTransaction.findUnique({
        where: { idempotencyKey: refundId },
        include: { lines: true },
      });
      if (existingRefund) {
        return toJournalEntry(existingRefund);
      }

      // 2. Lock the original settlement row using PostgreSQL SELECT ... FOR UPDATE
      const lockedSettlement = await tx.$queryRawUnsafe<Array<{ id: string; sumDebitsPaise: number }>>(
        `SELECT id, "sumDebitsPaise" FROM "LedgerTransaction" WHERE "orderId" = $1 AND "transactionType" = 'ORDER_SETTLEMENT' FOR UPDATE;`,
        orderId
      );

      if (!lockedSettlement || lockedSettlement.length === 0) {
        throw new Error(`Cannot process refund: No confirmed settlement found in PostgreSQL for order ${orderId}.`);
      }

      const settlementId = lockedSettlement[0].id;
      const originalGrossPaise = lockedSettlement[0].sumDebitsPaise;

      // 3. Retrieve original settlement lines to extract original merchant and platform allocations
      const origLines = await tx.ledgerJournalLine.findMany({
        where: { transactionId: settlementId },
      });
      const origMerchantPaise = origLines.find((l) => l.account === 'MERCHANT_PAYABLE')?.creditPaise || 0;
      const origPlatformPaise = origLines.find((l) => l.account === 'PLATFORM_REVENUE')?.creditPaise || 0;

      // 4. Retrieve all prior refund records for this order to enforce cumulative limits and avoid rounding drift
      const priorRefunds = await tx.refundRecord.findMany({
        where: { orderId },
      });

      const priorRefundsPaise = priorRefunds.reduce((sum, r) => sum + r.amountPaise, 0);
      const priorMerchantReversed = priorRefunds.reduce((sum, r) => sum + r.reversedMerchantPaise, 0);
      const priorPlatformReversed = priorRefunds.reduce((sum, r) => sum + r.reversedPlatformPaise, 0);

      const newCumulativeRefundPaise = priorRefundsPaise + totalRefundPaise;

      // Invariant: Cumulative refunds must never exceed original order gross amount
      if (newCumulativeRefundPaise > originalGrossPaise) {
        throw new Error(
          `Cumulative refunds (₹${newCumulativeRefundPaise / 100}) exceed original order amount (₹${originalGrossPaise / 100}).`
        );
      }

      // 5. Prevent rounding drift across partial refunds using Cumulative Allocation formula:
      // Current Allocation = Target Cumulative Allocation - Previously Reversed Allocation
      const targetCumulativeMerchantPaise = Math.round(origMerchantPaise * (newCumulativeRefundPaise / originalGrossPaise));
      const targetCumulativePlatformPaise = Math.round(origPlatformPaise * (newCumulativeRefundPaise / originalGrossPaise));

      const revMerchantPaise = targetCumulativeMerchantPaise - priorMerchantReversed;
      const revPlatformPaise = targetCumulativePlatformPaise - priorPlatformReversed;
      const revTdsPaise = totalRefundPaise - revMerchantPaise - revPlatformPaise;

      const lines: JournalLine[] = [
        // Debits: Proportional clawback of merchant payable, platform commission, and TDS liability
        { account: 'MERCHANT_PAYABLE', debitPaise: revMerchantPaise, creditPaise: 0 },
        ...(revPlatformPaise > 0 ? [{ account: 'PLATFORM_REVENUE' as LedgerAccount, debitPaise: revPlatformPaise, creditPaise: 0 }] : []),
        ...(revTdsPaise > 0 ? [{ account: 'TDS_PAYABLE_GOVT' as LedgerAccount, debitPaise: revTdsPaise, creditPaise: 0 }] : []),
        // Credits: Reimburse gateway clearing and wallet liability to customer
        { account: 'GATEWAY_CLEARING', debitPaise: 0, creditPaise: gatewayPaise },
        { account: 'WALLET_LIABILITY', debitPaise: 0, creditPaise: walletPaise },
      ];

      const sumDebitsPaise = lines.reduce((sum, l) => sum + l.debitPaise, 0);
      const sumCreditsPaise = lines.reduce((sum, l) => sum + l.creditPaise, 0);
      const isBalanced = sumDebitsPaise === sumCreditsPaise;

      if (!isBalanced) {
        throw new Error(`Unbalanced refund entry for ${orderId}: Debits (${sumDebitsPaise}) !== Credits (${sumCreditsPaise})`);
      }

      // 6. Persist RefundRecord and Reversal LedgerTransaction atomically
      await tx.refundRecord.create({
        data: {
          refundId,
          orderId,
          settlementId,
          amountPaise: totalRefundPaise,
          cumulativeRefundedPaise: newCumulativeRefundPaise,
          reversedMerchantPaise: revMerchantPaise,
          reversedPlatformPaise: revPlatformPaise,
          reversedTdsPaise: revTdsPaise,
          gatewayRefundPaise: gatewayPaise,
          walletRefundPaise: walletPaise,
          status: 'PROCESSED',
        },
      });

      const reversalTx = await tx.ledgerTransaction.create({
        data: {
          orderId,
          transactionType: 'ORDER_REFUND',
          idempotencyKey: refundId,
          description: `Refund reversal [${refundId}] for order ${orderId}`,
          sumDebitsPaise,
          sumCreditsPaise,
          isBalanced: true,
          lines: {
            create: lines.map((l) => ({
              account: l.account,
              debitPaise: l.debitPaise,
              creditPaise: l.creditPaise,
            })),
          },
        },
        include: { lines: true },
      });

      return toJournalEntry(reversalTx);
    };

    if (txClient) {
      return executeInTx(txClient);
    }
    return prisma.$transaction(executeInTx);
  }

  /**
   * Retrieve journal entries directly from PostgreSQL.
   */
  public async getJournalEntries(orderId?: string, txClient?: Prisma.TransactionClient): Promise<JournalEntry[]> {
    this.assertProductionDatabaseConfigured();
    const client = txClient || prisma;
    const records = await client.ledgerTransaction.findMany({
      where: orderId ? { orderId } : undefined,
      include: { lines: true },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toJournalEntry);
  }

  /**
   * Retrieve refund records directly from PostgreSQL.
   */
  public async getRefundRecords(orderId?: string, txClient?: Prisma.TransactionClient): Promise<StoredRefundRecord[]> {
    this.assertProductionDatabaseConfigured();
    const client = txClient || prisma;
    const records = await client.refundRecord.findMany({
      where: orderId ? { orderId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      refundId: r.refundId,
      settlementId: r.settlementId,
      amountPaise: r.amountPaise,
      cumulativeRefundedPaise: r.cumulativeRefundedPaise,
      reversedMerchantPaise: r.reversedMerchantPaise,
      reversedPlatformPaise: r.reversedPlatformPaise,
      reversedTdsPaise: r.reversedTdsPaise,
      gatewayRefundPaise: r.gatewayRefundPaise,
      walletRefundPaise: r.walletRefundPaise,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Calculate trial balance directly aggregated from PostgreSQL LedgerJournalLine table.
   */
  public async getTrialBalance(txClient?: Prisma.TransactionClient): Promise<{ totalDebitsPaise: number; totalCreditsPaise: number; isBalanced: boolean }> {
    this.assertProductionDatabaseConfigured();
    const client = txClient || prisma;
    const aggregate = await client.ledgerJournalLine.aggregate({
      _sum: {
        debitPaise: true,
        creditPaise: true,
      },
    });
    const totalDebitsPaise = aggregate._sum.debitPaise || 0;
    const totalCreditsPaise = aggregate._sum.creditPaise || 0;
    return {
      totalDebitsPaise,
      totalCreditsPaise,
      isBalanced: totalDebitsPaise === totalCreditsPaise,
    };
  }
}

export const financialLedger = new FinancialLedgerStore();
