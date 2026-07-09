# NULLXES Digital Employees — Platform Scope

Legend: **✅** done (backend + frontend where applicable) · **🟡** partial / placeholder · **⬜** not started

Last updated: **2026-07-09** (billing plans `studio`/`operator`/`scale`, Neon HTTP migrate, xAI Voice, security hardening).

---

## Roadmap sprints

| Sprint / Phase | Scope | Status |
|----------------|-------|--------|
| **Sprint A — Phase 1** | Talk session limits (UI + server), Stripe removed, Polar webhook tiers | ✅ |
| **Sprint A — Phase 2** | Public API (`/api/v1`), API keys, outbound HMAC webhooks, OpenAPI docs | ✅ |
| **Sprint B — S.3** | Team invites (create, resend, revoke, role change, remove) | ✅ |
| **Sprint B — S.3.1** | Accept invite flow + OAuth (Google/GitHub optional) | ✅ |
| **Sprint C — S.6** | Notifications (Inngest + Resend, org `notify*` flags) | ✅ |
| **Sprint C — S.2.1** | i18n sweep (en/ru via next-intl) | ✅ |
| **S.4 Billing** | Polar self-serve: Studio / Team / Scale (+ monthly/annual, Enterprise / Government manual) | ✅ |
| **S.5 Integrations** | Provider status + Slack/Teams OAuth connect | ✅ |
| **S.7 Security** | Live TOTP, API key CRUD + pepper, IP allowlist, outbound webhooks | ✅ |
| **S.8 Advanced** | Data export download + queued job (Inngest) | 🟡 |
| **RU Acquiring** | Local payment rails | ⬜ |

---

## Billing plans (source of truth: `src/features/billing/config/plans.ts`)

USD Polar presentment. DB id `operator` is displayed as **Team**. Annual = −20% (separate Polar products).

| Plan (DB) | UI | Monthly | Annual | Employees | Session | Talk min/mo | API |
|-----------|-----|---------|--------|-----------|---------|-------------|-----|
| **free** | Evaluation | $0 | — | 1 | 120 s | 30 | none |
| **studio** | Studio | $49 | $470 | 1 | 600 s | 180 | none |
| **operator** | Team | $200 | $1 920 | 3 | 1 200 s | 600 | read |
| **scale** | Scale | $600 | $5 760 | 10 | 1 800 s | 2 000 | full |
| **enterprise** | Enterprise | Contact sales | — | ∞ | ∞ | ∞ | full |
| **government** | Government | Contact sales | — | ∞ | ∞ | ∞ | full |

Legacy `super_pro` → **`scale`** (migration `0038` + Polar remap). Sync catalog: `npm run polar:setup`.

Talk minutes / month are **enforced** (`assertTalkMinutesBudget`).

---

## i18n (S.2.1)

| Area | Backend | Frontend | Notes |
|------|---------|----------|-------|
| Shell / navigation | — | ✅ | `layout`, sidebar, user menu |
| Dashboard | — | ✅ | KPIs, carousel, activity, live sessions |
| Employees list + card | — | ✅ | |
| Employee detail (knowledge, lifecycle, blueprint) | — | ✅ | |
| Talk runtime session | — | ✅ | Anam + xAI Voice paths |
| Studio (avatar, voice, brain) | — | ✅ | |
| Missions | — | ✅ | List / detail / create |
| Conversations | — | ✅ | 3-pane workspace |
| HQ | — | ✅ | 3D office |
| Settings (all tabs) | — | ✅ | Including Characters / Skills / Tools |
| Analytics | — | ✅ | Full screen |

Locale switching: **Settings → General → Language** (persisted to `organization_settings`).

---

## Infrastructure

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Next.js 16 App Router + proxy | ✅ | ✅ | `npm run build` (= `db:migrate` + `next build`) |
| Neon + Drizzle (39 migrations through `0038`) | ✅ | — | `db:migrate` (Neon HTTP), `db:verify` |
| Inngest (dev + prod handlers) | ✅ | — | `inngest:dev` |
| Provider env getters | ✅ | — | `providers:status` |

**Migrate toolchain:** `npm run db:migrate` → `scripts/db-migrate.mjs` (Neon HTTP). Do **not** use `drizzle-kit migrate` CLI on Windows — it often fails silently via WebSocket.

---

## Auth & workspace

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Better Auth (email/password) | ✅ | ✅ | `auth:verify` |
| OAuth (Google/GitHub, optional) | ✅ | ✅ | env-gated |
| Email OTP step-up + 2FA (TOTP) | ✅ | ✅ | `email-otp:verify` |
| Workspace bootstrap + membership | ✅ | ✅ | `workspace:verify` |
| Team invites + accept flow | ✅ | ✅ | Settings → Team |

---

## Digital employees

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Employee CRUD + lifecycle | ✅ | ✅ | `employee:verify` |
| Create wizard + studio | ✅ | ✅ | Anam avatar, ElevenLabs / Anam voice, xAI Voice provision |
| Knowledge ingest + indexing | ✅ | ✅ | Inngest pipeline |
| Provider config (brain/voice/avatar) | ✅ | ✅ | `provider-provisioning:verify` |
| Scenarios (picker → Talk → debrief) | ✅ | ✅ | Plan-gated monthly limits |

---

## Agent Blueprint (Character / Skills / Tools)

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Schema + system seed catalog | ✅ | — | migration `0030`, `agent-blueprint:verify` |
| Settings CRUD (Characters / Skills / Tools) | ✅ | ✅ | `/settings?tab=characters\|skills\|tools` |
| Employee tabs + studio character step | ✅ | ✅ | employee detail / create wizard |
| Runtime composition (Talk prompt layers + tool slugs) | ✅ | — | `build-talk-brain-request.ts` |
| Mission `skill_ids` linkage | ✅ | 🟡 | `resolve-mission-skill-prompts.ts` |
| Default blueprint on create + backfill | ✅ | — | `blueprint:backfill` |
| Custom webhook tools / MCP / Public API blueprint scopes | ⬜ | ⬜ | Phase B |

Brief: [`AGENT_BLUEPRINT_2026-07-05.md`](./AGENT_BLUEPRINT_2026-07-05.md)

---

## Talk (W.2)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Anam live avatar session | ✅ | ✅ | Inspector, status bar, brain-stream |
| xAI Grok Voice | ✅ | ✅ | Talk + Conversations; `XAI_API_KEY` |
| Stream Chat sidebar + threads | ✅ | ✅ | Multi-thread channels |
| Conversations workspace | ✅ | ✅ | `/dashboard/conversations` |
| Session recording + limits | ✅ | ✅ | Per-plan session seconds + monthly Talk minutes |
| Turn metrics | ✅ | — | `employee_session_turn` (migration `0032`) |
| Public API sessions | ✅ | — | `/api/v1/sessions` |

---

## Missions

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Mission CRUD + timeline | ✅ | ✅ | `/dashboard/missions` |
| Types | ✅ | ✅ | `prospecting`, `prospecting_en`, `investor_base`, `custom` |
| Schedules (cron) | ✅ | ✅ | Inngest daily runner |
| Skill_ids → blueprint prompts | ✅ | 🟡 | Runtime wired; UI partial |
| Approvals / outbound / handoff | ✅ | ✅ | Inngest workers |

Brief: [`AGENT_MISSIONS_2026-07-05.md`](./AGENT_MISSIONS_2026-07-05.md)

---

## HQ

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| 3D office floor | ✅ | ✅ | `/dashboard/hq` |
| HQ tasks / departments | ✅ | ✅ | `hq_task`, department assignment |

---

## Billing (S.4 — Polar)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Polar checkout + webhook | ✅ | ✅ | Stripe removed |
| Plan tiers (6 plans above) | ✅ | ✅ | Self-serve: studio / operator / scale |
| Customer portal link | ✅ | ✅ | Settings → Billing |
| Usage / plan limit enforcement | ✅ | ✅ | Employees, Talk, knowledge, API access |

---

## Public API (W.2.1)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| API key auth (`nx_live_…`) | ✅ | ✅ | Settings → Security; HMAC pepper via `API_KEY_PEPPER` |
| Plan-gated access | ✅ | — | Operator = read; Scale+ = full |
| `/api/v1/employees` CRUD | ✅ | — | |
| `/api/v1/sessions` | ✅ | — | |
| `/api/v1/employees/:id/tasks`, `/workforce/assign` | ✅ | — | |
| Outbound webhooks (HMAC) | ✅ | ✅ | Settings → Security |
| OpenAPI + `/api/docs` | ✅ | ✅ | |

---

## Notifications (S.6)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Org notification flags | ✅ | ✅ | Settings → Notifications |
| Inngest handlers | ✅ | — | session, knowledge failed, employee created, weekly digest |
| Resend email delivery | ✅ | — | Requires `RESEND_API_KEY` |

---

## Analytics

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Metrics queries + export | ✅ | ✅ | |
| Date range controls | ✅ | ✅ | |
| i18n (en/ru) | — | ✅ | Full screen |

---

## Settings tabs

| Tab | Backend | Frontend i18n | Live features |
|-----|---------|---------------|---------------|
| General / Organization | ✅ | ✅ | Profile, preferences, defaults, privacy |
| Billing | ✅ | ✅ | Polar plans + portal |
| Team | ✅ | ✅ | Invites + members |
| Notifications | ✅ | ✅ | Persisted toggles |
| Integrations | ✅ | ✅ | Provider status + Slack/Teams OAuth |
| Security | ✅ | ✅ | 2FA, API keys, IP allowlist, webhooks |
| AI | ✅ | ✅ | Default LLM pointer |
| Characters / Skills / Tools | ✅ | ✅ | Agent Blueprint CRUD |
| Advanced | 🟡 | ✅ | Export download + job queue |

---

## Next priorities

1. **S.8 Advanced** — harden async export jobs + download UX
2. **Blueprint Phase B** — webhook tools / MCP / Public API blueprint scopes
3. **RU Acquiring** — regional payment provider
4. **Mission skill UI** — finish skill_ids picker parity with Talk blueprint
5. **Auth page i18n** — login/register if needed
