# NULLXES Digital Employees — Platform Scope

Legend: **✅** done (backend + frontend where applicable) · **🟡** partial / placeholder · **⬜** not started

Last updated: 2026-07-05 (Agent Blueprint + domain agent briefs).

---

## Roadmap sprints

| Sprint / Phase | Scope | Status |
|----------------|-------|--------|
| **Sprint A — Phase 1** | Talk 2 min limit (UI + server), Stripe removed, Polar webhook tiers | ✅ |
| **Sprint A — Phase 2** | Public API (`/api/v1`), API keys, outbound HMAC webhooks, OpenAPI docs | ✅ |
| **Sprint B — S.3** | Team invites (create, resend, revoke, role change, remove) | ✅ |
| **Sprint B — S.3.1** | Accept invite flow + OAuth (Google/GitHub optional) | ✅ |
| **Sprint C — S.6** | Notifications (Inngest + Resend, org `notify*` flags) | ✅ |
| **Sprint C — S.2.1** | i18n sweep (en/ru via next-intl) | ✅ |
| **S.5 Integrations** | Provider status tab (read-only deployment snapshot) | 🟡 |
| **S.7 Security** | 2FA / API keys UI scaffold; live TOTP + key CRUD | 🟡 |
| **S.8 Advanced** | Data export download + queued job placeholder | 🟡 |
| **RU Acquiring** | Local payment rails | ⬜ |

---

## i18n (S.2.1)

| Area | Backend | Frontend | Notes |
|------|---------|----------|-------|
| Shell / navigation | — | ✅ | `layout`, sidebar, user menu |
| Dashboard | — | ✅ | KPIs, carousel, activity, live sessions |
| Employees list + card | — | ✅ | |
| Employee detail (knowledge, lifecycle) | — | ✅ | |
| Talk runtime session | — | ✅ | All talk components |
| Studio (avatar, voice, brain) | — | ✅ | |
| Settings — General | — | ✅ | Includes select options (industry, timezone, etc.) |
| Settings — Billing | — | ✅ | |
| Settings — Security | — | ✅ | |
| Settings — Integrations | — | ✅ | |
| Settings — AI | — | ✅ | |
| Settings — Notifications | — | ✅ | |
| Settings — Team | — | ✅ | |
| Settings — Advanced | — | ✅ | |
| Settings — Context panel | — | ✅ | |
| Analytics (full screen) | — | ✅ | KPIs, charts, tables, overviews |

Locale switching: **Settings → General → Language** (persisted to `organization_settings`).

---

## Infrastructure

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Next.js 16 App Router + proxy | ✅ | ✅ | `npm run build` |
| Neon + Drizzle migrations | ✅ | — | `db:verify` |
| Inngest (dev + prod handlers) | ✅ | — | `inngest:dev` |
| Provider env getters | ✅ | — | `providers:status` |

---

## Auth & workspace

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Better Auth (email/password) | ✅ | ✅ | `auth:verify` |
| OAuth (Google/GitHub, optional) | ✅ | ✅ | env-gated |
| Workspace bootstrap + membership | ✅ | ✅ | `workspace:verify` |
| Team invites + accept flow | ✅ | ✅ | Settings → Team |

---

## Digital employees

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Employee CRUD + lifecycle | ✅ | ✅ | `employee:verify` |
| Create wizard + studio | ✅ | ✅ | Anam avatar, ElevenLabs voice |
| Knowledge ingest + indexing | ✅ | ✅ | Inngest pipeline |
| Provider config (brain/voice/avatar) | ✅ | ✅ | `provider-provisioning:verify` |

---

## Agent Blueprint (Character / Skills / Tools)

| Module | Backend | Frontend | Verify |
|--------|---------|----------|--------|
| Schema (`character_preset`, `skill`, `tool_definition` + employee join tables) | ✅ | — | migration `0030` |
| System seed catalog (`system-catalog.ts`) | ✅ | — | `agent-blueprint:verify` |
| Settings CRUD (Characters / Skills / Tools tabs) | ✅ | ✅ | `/settings?tab=characters\|skills\|tools` |
| Employee tabs (Character / Skills / Tools) | ✅ | ✅ | employee detail |
| Runtime composition (Talk prompt layers + tool slugs) | ✅ | — | `build-talk-brain-request.ts` |
| Mission `skill_ids` linkage | ✅ | 🟡 | `resolve-mission-skill-prompts.ts` |
| Studio wizard character step | ✅ | ✅ | create wizard step `character` |
| Default blueprint on employee create + backfill script | ✅ | — | `blueprint:backfill` |
| Custom webhook tools / MCP / Public API scopes | ⬜ | ⬜ | Phase B |

Brief: [`AGENT_BLUEPRINT_2026-07-05.md`](./AGENT_BLUEPRINT_2026-07-05.md)

---

## Talk (W.2)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Anam live avatar session | ✅ | ✅ | Inspector panel, status bar |
| Stream Chat sidebar + threads | ✅ | ✅ | Multi-thread channels |
| Conversations workspace | ✅ | ✅ | `/dashboard/conversations` — 3-pane, bubble UI |
| Session recording + limits | ✅ | ✅ | Free plan 2 min cap |
| Public API sessions | ✅ | — | `/api/v1/sessions` |

---

## Billing (S.4 — Polar)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Polar checkout + webhook | ✅ | ✅ | Stripe removed |
| Plan tiers (free / super_pro / enterprise / government) | ✅ | ✅ | |
| Customer portal link | ✅ | ✅ | Settings → Billing |
| Usage meters | ✅ | ✅ | |

---

## Public API (W.2.1)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| API key auth (`nx_...`) | ✅ | 🟡 | Created in Security tab |
| `/api/v1/employees` CRUD | ✅ | — | |
| `/api/v1/sessions` | ✅ | — | |
| Outbound webhooks (HMAC) | ✅ | 🟡 | Settings columns; UI partial |
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
| Integrations | ✅ | ✅ | Provider status read-only |
| Security | 🟡 | ✅ | 2FA/API keys scaffold |
| AI | ✅ | ✅ | Default LLM pointer |
| Advanced | 🟡 | ✅ | Export download + job queue stub |

---

## Next priorities

1. **S.7 Security** — live TOTP enrollment, API key CRUD persistence
2. **S.8 Advanced** — real async export jobs (Inngest) + download links
3. **S.5 Integrations** — OAuth connectors beyond status display
4. **RU Acquiring** — regional payment provider
5. **Dashboard i18n gaps** — auth pages (login/register) if needed
