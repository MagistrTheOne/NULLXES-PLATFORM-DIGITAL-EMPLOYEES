# NULLXES Digital Employees — Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | **AI agents / architecture** | Mermaid C4 / Talk / Missions / ERD (live: `/docs/architecture`) |
| [AGENT_REFERENCE_2026-06-26.md](./AGENT_REFERENCE_2026-06-26.md) | **AI agents / Cursor** | Technical reference (refreshed 2026-07-09): API, schema, env, migrate, billing |
| [AGENT_MOBILE_CLIENT_2026-07-04.md](./AGENT_MOBILE_CLIENT_2026-07-04.md) | **AI agents / mobile** | Mobile client brief: features, style, APIs, Talk SLA |
| [AGENT_BLUEPRINT_2026-07-05.md](./AGENT_BLUEPRINT_2026-07-05.md) | **AI agents / blueprint** | Character, Skills, Tools: schema, CRUD, runtime composition |
| [AGENT_DIGITAL_EMPLOYEES_2026-07-05.md](./AGENT_DIGITAL_EMPLOYEES_2026-07-05.md) | **AI agents / employees** | Entity model, studio wizard, lifecycle, blueprint defaults |
| [AGENT_TALK_2026-07-05.md](./AGENT_TALK_2026-07-05.md) | **AI agents / Talk** | brain-stream, prompt layers, tool gating, xAI Voice, SLA |
| [AGENT_MISSIONS_2026-07-05.md](./AGENT_MISSIONS_2026-07-05.md) | **AI agents / missions** | Missions, schedules, skill_ids, Inngest workers |
| [SCALING_2026-07-04.md](./SCALING_2026-07-04.md) | Engineering / DevOps | Scaling: 10 → 100 → 1000+ users, plan limits, ops checklist |
| [PLATFORM_SCOPE.md](./PLATFORM_SCOPE.md) | Product / engineering | Sprint roadmap and module status matrix (2026-07-09) |
| [PUBLIC_API.md](./PUBLIC_API.md) | Integrations / QA | Public API v1 TZ: OpenAPI contract, Orval SDK, scopes, probe, curl |
| [DEPLOYMENT_RF.md](./DEPLOYMENT_RF.md) | DevOps | Russia deployment + production env checklist |
| [RESPONSIVE_VERIFICATION.md](./RESPONSIVE_VERIFICATION.md) | QA / frontend | Viewport checklist for dashboard routes |
| [BETA_FREE_TIER.md](./BETA_FREE_TIER.md) | Ops / beta | Free catalog employees, partner shell orgs, seed |

**Live OpenAPI:** `GET /api/docs` → `public/openapi.yaml`  
**Human API docs:** `/docs/api`  
**Docs portal:** `/docs` (v2.1 developer portal) · Yuki Nakora: `/docs/assistant`  
**Agent index:** `/llms.txt` · `/llms-full.txt`  
**Typed client:** `npm run api:generate` (Orval)

**Database:** 40 migrations through `0040_platform_employee_catalog`. Apply with `npm run db:migrate` (Neon HTTP — not `drizzle-kit migrate` CLI).

**Billing plans:** `free` · `studio` · `operator` · `scale` · `enterprise` · `government` (`src/features/billing/config/plans.ts`).

**Agent rules (always-on):** [`../AGENTS.md`](../AGENTS.md)
