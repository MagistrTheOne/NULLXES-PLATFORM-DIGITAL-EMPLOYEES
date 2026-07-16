# Enterprise Architecture Review

**Product:** NULLXES Digital Employees  
**Review type:** Static code / structure (no build, no install, no tests, no runtime)  
**Date:** 2026-07-16  
**Scope:** Core platform code organization and architecture. HQ, Capsules, Inventory and related product domains are **in-scope as intentional product surface** — they are not treated as architectural debt in this review.  
**Method:** Repository structure, docs, feature/entity boundaries, data access patterns, API/runtime composition.

---

## 1. Score

| Metric | Score |
|--------|------:|
| **Architecture** | **8.7 / 10** |

### Scoring rationale

Feature-first layout, documented C4/Talk/Missions/ERD, clear Digital Employee primacy, Server Actions + Route Handlers + Inngest separation, and mature agent docs justify a high enterprise architecture score. Residual deductions: incomplete RLS wiring (documented as WIP), dual DB clients (HTTP vs pool), and naming drift (`employee` / `employees`, `runtime` / `runtime-session` / `runtime-engine`).

---

## 2. Executive summary

The codebase is a coherent **Digital Workforce Operating System** monolith on Next.js 16 App Router, not a dashboard shell. Domain modules are feature-scoped under `src/features/*` with persistence schemas under `src/entities/*`. Talk, Missions, Blueprint, Public API, Billing, and Auth form a consistent control plane. Architecture documentation (`docs/ARCHITECTURE.md`, agent briefs, `PLATFORM_SCOPE.md`) is unusually strong for a pre-beta product.

Primary architectural risk is **tenant isolation still being application-layer first**, with Postgres RLS present but default-bypass until paths migrate to `withTenantContext` (`docs/RLS.md`).

---

## 3. System shape

```text
Operator UI (App Router)
  → Server Actions / Route Handlers
  → Feature services
  → Entities (Drizzle) → Neon PostgreSQL
  → Inngest workers (missions, knowledge, retention, notifications)
  → External providers (LLM, Anam, xAI, Stream, Polar, …)
```

Containers match `docs/ARCHITECTURE.md`: Web, API routes, Workers, DB, Avatar/Voice, LLM, payments.

---

## 4. Project structure

| Layer | Path | Role |
|-------|------|------|
| App shell | `src/app/` | Routes, layouts, API handlers |
| Features | `src/features/*` | Domain use-cases, UI, actions |
| Entities | `src/entities/*` | Schema, relations, entity verify |
| Shared | `src/shared/` | DB, config, security, email |
| Providers | `src/providers/` | Provider adapters |
| Workers | `src/inngest/` | Async jobs |
| Docs | `docs/` | Architecture + agent briefs |

**Modularity:** Strong. Business logic lives in features; UI is generally co-located; `server-only` used where expected.

**Boundaries:** Talk runtime (`runtime-session`), brain composition, agent-tools, knowledge-retrieval, and public-api are separable modules with clear entry points.

**Naming consistency:** Acceptable with known drift (`features/employee` vs `employees`). Not a release blocker.

---

## 5. Scalability & maintainability

| Concern | Assessment |
|---------|------------|
| Horizontal scale (HTTP CRUD) | Stateless Vercel functions — good |
| Async work | Inngest — correct offload |
| Hot path | Talk brain-stream + RAG + avatar — cost/latency bound, documented in `SCALING_2026-07-04.md` |
| Maintainability | High for core domains; verify scripts encode contracts |
| Coupling | Provider SDKs isolated behind feature services; Anam proxy centralizes browser CORS/SSRF control |
| Technical debt (arch) | RLS coverage incomplete; migrate-on-build couples schema to deploy |

HQ / Capsules / Inventory increase surface area by design. They do not invalidate the core Digital Employee architecture.

---

## 6. Separation of concerns

**Strengths**

- Auth (Better Auth) vs workspace permissions vs billing plan gates.
- Blueprint (Character / Skills / Tools) composed at Talk prompt build time.
- Public API (`/api/v1`) separate from dashboard Server Actions.
- Knowledge ingest (Inngest) vs retrieval (Talk turn).

**Weaknesses**

- Some paths still use raw `db` without tenant transaction context (see Security / RLS docs).
- Landing demo reuses full Talk brain request builder (AI Platform Review) — architectural reuse without a public facade.

---

## 7. Feature organization (core)

Treated as first-class product, not beta noise:

- Digital Employees + Studio + lifecycle  
- Talk (Anam / xAI / Stream)  
- Agent Blueprint  
- Missions + approvals + outbound  
- Knowledge processing / retrieval  
- Conversations workspace  
- Public API + webhooks  
- Billing / plans / usage limits  
- Auth / team / security settings  
- HQ, Capsules, Inventory (intentional UX domains)

---

## 8. Architectural strengths

1. Feature-first enterprise layout aligned with AGENTS.md.  
2. Living architecture diagrams + `/docs/architecture`.  
3. Explicit Talk sequence and tool grounding strategy.  
4. Plan capabilities as policy, not scattered magic numbers.  
5. Provider pool / failover patterns (Anam).  
6. Encryption, audit, retention hooks designed into the platform.  
7. OpenAPI + Orval for Public API contract discipline.

---

## 9. Architectural risks (code-level)

| Priority | Risk | Evidence |
|----------|------|----------|
| P1 | RLS default bypass until callers opt into tenant context | `docs/RLS.md`, `drizzle/0042_tenant_rls.sql` |
| P2 | Dual DB clients (HTTP neon vs pool transactions) increase mental load | `src/shared/db/client.ts`, `pool-client.ts` |
| P3 | Landing reuses private Talk build path | `adeline-demo/brain-stream` → `buildTalkBrainRequest` |
| P4 | Naming drift across employee/runtime modules | `src/features/*` |

---

## 10. Recommendations (architecture only)

1. Complete `withTenantContext` rollout per `docs/RLS.md` “Next”; then flip default away from bypass for app roles.  
2. Introduce an explicit **public Talk facade** for landing (thin prompt, no live org state) without changing HQ/Capsules.  
3. Publish an internal module ownership map (`employee` vs `employees`) to freeze naming.  
4. Keep migrate as a **release step**, not forever glued to every preview build (ops detail in Operational Review).  
5. Do not split microservices before ~1000 orgs — agrees with SCALING guide.

---

## 11. What was not verified

- Runtime performance / bundle sizes  
- Actual Neon RLS enforcement in production  
- CI enforcement of architecture lint rules  
- Whether all Server Actions consistently use workspace helpers  

---

## 12. Verdict

**Architecture is enterprise-grade for a Digital Employee OS.** Score **8.7** reflects structure, modularity, and documentation quality, with residual isolation wiring debt that is already acknowledged in-repo (`docs/RLS.md`).
