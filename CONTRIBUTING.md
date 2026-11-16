# Contributing to MegaBachatMart

Thank you for contributing to the MegaBachatMart Hyperlocal E-Commerce Platform!

## 1. Development Workflow
1. Clone the repository: `git clone https://github.com/fnxtinterns-Main/mymbmart.git`
2. Start local services: `docker compose up -d`
3. Install dependencies: `npm install`
4. Setup environment: Copy `.env.example` to `.env`
5. Generate Prisma Client: `npx prisma generate`
6. Run migrations & seed: `npx prisma migrate dev && npm run db:seed`
7. Start development server: `npm run dev` (Available at http://localhost:3000)

## 2. Commit Message Guidelines
We follow Conventional Commits format:
- `feat(scope): ...` for new capabilities
- `fix(scope): ...` for bug fixes
- `refactor(scope): ...` for non-behavioral structural changes
- `test(scope): ...` for test suites
- `docs(scope): ...` for documentation updates

## 3. Pull Request Requirements
- Clean CI pipeline run (Lint, Typecheck, Prisma validation, Build).
- No hardcoded mock customer accounts or synthetic tokens.
- Maintain append-only guarantees for ledger tables.
