# ADR-003: Row-Lock Atomic Stock Reservation and Deadlock Prevention

## Status
Accepted

## Context
When multiple customers place simultaneous orders for high-demand items or the last remaining unit of an SKU at a local store, naive read-modify-write operations lead to overselling and broken customer promises.

## Decision
1. **Row-Level Locking**: When reserving stock or pickup slots, the system acquires an explicit row lock:
   ```sql
   SELECT stock_on_hand, stock_reserved
   FROM shop_listings
   WHERE shop_id = $1 AND sku_id = $2
   FOR UPDATE;
   ```
2. **Deadlock Prevention**: In multi-item orders, SKU locks must be acquired in strictly alphabetical sorted order (`ORDER BY sku_id ASC`).
3. **Soft Reservation TTL**: Soft reservations expire automatically after 15 minutes (online payments) or 30 minutes (pay-at-store).
4. **Automatic Re-Routing**: If a stock lock fails due to a concurrency race, the routing engine immediately cascades to the next-ranked candidate store.

## Consequences
- Guaranteed zero overselling.
- Predictable and deterministic reservation lifecycle.
