# Enterprise review pack (2026-07-16)

Static reviews only — no build, install, or tests. HQ / Capsules / Inventory treated as intentional product surface.

| # | Document | Focus | Score |
|---|----------|-------|------:|
| 1 | [Enterprise Architecture Review](./01-ENTERPRISE_ARCHITECTURE_REVIEW.md) | Code structure, modularity, boundaries | **8.7** |
| 2 | [Enterprise Security Review](./02-ENTERPRISE_SECURITY_REVIEW.md) | Auth, headers, tenancy, API, CF | **7.8*** |
| 3 | [AI Platform Security Review](./03-AI_PLATFORM_SECURITY_REVIEW.md) | Prompts, tools, RAG, memory, Talk | **8.8*** |
| 4 | [Operational Readiness Review](./04-OPERATIONAL_READINESS_REVIEW.md) | Deploy, rollback, monitor, costs | **8.0** |

\* **Conditional:** Security 7.8 and AI Platform 8.8 hold only after documented **P0 gates** are closed before public beta. Residual risk with P0 open is lower (see each doc).

### Shared P0 gate (cross-cutting)

1. ~~Tool execute allowlist (`enabledToolSlugs`)~~ — closed in code (`executeAgentTool`)  
2. ~~Landing trusted IP + separate landing brain facade~~ — closed (`resolveTrustedClientIp` + `surface: "landing"`)  
3. RLS rollout progress per `docs/RLS.md` (Security) — still open  
4. Redis linked + auth step-up on in production (Security / Ops) — env/ops
