# ADR-002: Append-Only Immutable Ledgers for Financial and Inventory State

## Status
Accepted

## Context
In hyperlocal retail and community finance, race conditions, accidental data mutations, and untraceable manual stock adjustments erode partner trust and cause reconciliation discrepancies.

## Decision
All critical financial, commission, inventory movement, and operational records must be stored in strictly append-only, immutable ledgers:
1. `shop_stock_ledger`: Every stock receipt, sale, damage write-off, and reservation movement is an immutable row.
2. `payment_ledger`: Every rupee in or out is recorded as an immutable transaction.
3. `shop_ledger` & `seller_ledger`: Partner commissions and payouts are immutable.
4. `audit_log`: System security and routing actions cannot be altered.

Database permissions (`REVOKE UPDATE, DELETE`) are enforced at the database level for the application role. To correct an error, a compensating contra-entry must be appended.

## Consequences
- 100% auditability and financial reconciliation.
- Complete protection against accidental data loss or silent state corruption.
