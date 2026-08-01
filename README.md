# NULLXES Digital Employees

Digital Workforce Operating System — create, operate, and monitor digital employees.

Stack: Next.js 16 App Router · React 19 · Neon PostgreSQL · Drizzle · Better Auth · Inngest.

## Quick start

```bash
cp .env.example .env
# fill DATABASE_URL, BETTER_AUTH_SECRET, …

npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Ops

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply Drizzle migrations (Neon HTTP) — run **before** deploy |
| `npm run build` | `next build` only (does **not** migrate) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run talk:smoke` | Talk server-contract smoke (needs DB) |
| `npm run providers:status` | Provider env checklist |

Production deploy order: **migrate target DB → deploy immutable build**.

## Docs

- Index: [`docs/README.md`](docs/README.md)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Platform scope: [`docs/PLATFORM_SCOPE.md`](docs/PLATFORM_SCOPE.md)
- RF deploy: [`docs/DEPLOYMENT_RF.md`](docs/DEPLOYMENT_RF.md)
- Agent rules: [`AGENTS.md`](AGENTS.md)

Live docs portal: `/docs` · OpenAPI: `/api/docs`
