-- MegaBachatMart — Append-Only Ledger & Outbox Permission Policy (V5.3.1)
-- Principle: Financial ledger entries are strictly immutable.
-- Operational outbox events require update privileges for distributed locking and lifecycle transitions.

-- 1. Core Financial Double-Entry Ledger (Strictly Append-Only / Immutable)
REVOKE UPDATE, DELETE ON TABLE public."LedgerTransaction" FROM megabachat_app;
REVOKE UPDATE, DELETE ON TABLE public."LedgerJournalLine" FROM megabachat_app;
REVOKE UPDATE, DELETE ON TABLE public."RefundRecord" FROM megabachat_app;

-- 2. Operational Event Outbox (Stateful & Mutable Worker Queue)
-- The outbox worker must update status, lockedBy, lockedAt, retryCount, and processedAt.
-- NEVER revoke UPDATE on OutboxEvent.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."OutboxEvent" TO megabachat_app;

-- 3. Legacy / Underlying Ledgers (Retained for backwards compatibility)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shop_stock_ledger') THEN
        REVOKE UPDATE, DELETE ON TABLE public."shop_stock_ledger" FROM megabachat_app;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_ledger') THEN
        REVOKE UPDATE, DELETE ON TABLE public."payment_ledger" FROM megabachat_app;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shop_ledger') THEN
        REVOKE UPDATE, DELETE ON TABLE public."shop_ledger" FROM megabachat_app;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seller_ledger') THEN
        REVOKE UPDATE, DELETE ON TABLE public."seller_ledger" FROM megabachat_app;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
        REVOKE UPDATE, DELETE ON TABLE public."audit_log" FROM megabachat_app;
    END IF;
END $$;

