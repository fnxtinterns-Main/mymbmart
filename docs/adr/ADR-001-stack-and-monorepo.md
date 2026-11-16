# ADR-001: Technology Stack and Monorepo Architecture

## Status
Accepted

## Context
MegaBachatMart requires a high-performance, verifiable hyperlocal e-commerce platform supporting five distinct stakeholder portals: Customer Storefront, Local Kirana Shop Portal, SHG Producer Portal, Enterprise Operations Hub, and VPC Internal Services. The system requires rapid time-to-market, shared type safety across services, and sub-200ms P95 routing latencies.

## Decision
1. **Frontend & Fullstack Framework**: Next.js 15+ (App Router) with React 19, TypeScript strict mode, and Tailwind CSS.
2. **Database & ORM**: PostgreSQL 15+ with `pgcrypto` and `pg_trgm` extensions, managed via Prisma ORM for type-safe database queries.
3. **Hyperlocal Routing Engine**: In-memory and transactional deterministic scoring engine implementing 11 hard filters and 8 normalized scoring factors.
4. **API Surface**: OpenAPI 3.1 contract specification serving as the single source of truth across all mobile and web portals.

## Consequences
- Single unified codebase accelerates developer velocity and avoids version skew between frontend DTOs and backend entities.
- Postgres provides ACID compliance, row-level locking (`FOR UPDATE`), and foreign-key referential integrity.
