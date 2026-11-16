-- MegaBachatMart — Append-Only Ledger Enforcement Script
-- Guiding Principle: Money & Stock ledgers are strictly immutable and append-only.
-- Enforces REVOKE of UPDATE and DELETE for application roles on ledger tables.

-- 1. Inventory Stock Ledger
REVOKE UPDATE, DELETE ON TABLE public."shop_stock_ledger" FROM megabachat_app;

-- 2. Customer & Gateway Payment Ledger
REVOKE UPDATE, DELETE ON TABLE public."payment_ledger" FROM megabachat_app;

-- 3. Shop Partner Commission & Settlement Ledger
REVOKE UPDATE, DELETE ON TABLE public."shop_ledger" FROM megabachat_app;

-- 4. SHG Seller Payout & Consignment Ledger
REVOKE UPDATE, DELETE ON TABLE public."seller_ledger" FROM megabachat_app;

-- 5. Operations & System Audit Log
REVOKE UPDATE, DELETE ON TABLE public."audit_log" FROM megabachat_app;

-- Note: In the event of an erroneous entry, a compensating contra-entry must be appended.
