# NULLXES — Agent Technical Reference

**Product:** NULLXES Digital Employees  
**Snapshot date:** 2026-06-26 (refreshed **2026-07-09**)  
**Repo:** `dplatform`  
**Branch baseline:** `main` (billing `0038`, Neon HTTP migrate, xAI Voice, security hardening)

This document is the single source of truth for AI coding agents working in this repository. Read [`AGENTS.md`](../AGENTS.md) for product philosophy and iteration constraints. Product status matrix: [`PLATFORM_SCOPE.md`](./PLATFORM_SCOPE.md).

---

## 1. Stack & UI (shadcn)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | Better Auth (single auth system) |
| UI | **shadcn/ui only** — Tailwind CSS v4 |
| Chat | Stream Chat (`stream-chat`, `stream-chat-react`) |
| Video avatar | Anam AI SDK |
| Jobs | Inngest |
| i18n | next-intl (`en`, `ru`) |

### shadcn configuration (`components.json`)

- **Style:** `radix-maia` (preset `b1Hw82iEOu`, applied 2026-06-26)
- **CLI:** `shadcn@4.11.1`
- **CSS entry:** `src/app/globals.css` (imports `shadcn/tailwind.css`)
- **Icons:** lucide-react
- **Fonts:** Inter (sans), Figtree (heading), Geist Mono — `src/app/layout.tsx`
- **Theme:** NULLXES monochrome dark — pure black `#000` background, no accent colors in product UI

**Update all UI primitives:**

```bash
npx shadcn add --all -y -o
```

Components live in `components/ui/`. Do not add Material UI, Ant Design, Chakra, or raw Radix outside shadcn wrappers.

---

## 2. Recent patches (through 2026-07-09)

Treat as current behavior (newest first):

| Area | Change |
|------|--------|
| DB migrate | `npm run db:migrate` → `scripts/db-migrate.mjs` (Neon HTTP). `build` = migrate + `next build`. Avoid `drizzle-kit migrate` CLI (silent WS failures on Windows). |
| Billing | Plans: `free` / `studio` / `operator` / `scale` / `enterprise` / `government`. Legacy `super_pro` → `scale` (`0038`). Talk minutes/month enforced. |
| Security | Live TOTP, API key CRUD, `API_KEY_PEPPER` HMAC hashes (`hmac1:`), IP allowlist, SSRF/rate-limit hardening |
| Auth | Google + GitHub OAuth (env-gated), email OTP step-up |
| Talk | xAI Grok Voice (`/api/talk/xai-voice/*`), Anam realtime plane, turn metrics (`0032`) |
| Brain | Multi-provider transport + NULLXES SDK; `organization_provider` nullxes (`0037`) |
| Missions | Types `prospecting_en` / `investor_base` (`0031`); schedules, outbound, handoff Inngest workers |
| Integrations | Slack + Teams OAuth authorize/callback routes |

Older UI commits (Conversations grid, Talk inspector, HQ floor) from 2026-06 remain valid.

---

## 3. Product surfaces (routes)

| Route | Feature module | Purpose |
|-------|----------------|---------|
| `/dashboard` | `features/overview` | Workforce overview |
| `/dashboard/employees` | `features/employees` | Digital employee roster |
| `/dashboard/employees/[id]` | `features/employees` | Profile, knowledge, lifecycle, blueprint tabs |
| `/dashboard/employees/[id]/talk` | `features/runtime-session` | Live Talk: Anam / xAI Voice + Stream + inspector |
| `/dashboard/employees/[id]/scenarios` | `features/scenarios` | Scenario picker |
| `/dashboard/employees/[id]/scenarios/[id]/debrief` | `features/scenarios` | Scenario debrief |
| `/dashboard/conversations` | `features/conversations` | Text-first 3-pane workspace (`?employee=<uuid>`) |
| `/dashboard/missions` | `features/missions` | Mission list / create / detail / edit |
| `/dashboard/hq` | `features/hq` | 3D office floor (`?department=<slug>`) |
| `/dashboard/analytics` | `features/analytics` | Session/message KPIs |
| `/dashboard/admin/anam` | `features/admin` | Anam pool admin (platform admin) |
| `/settings` | `features/settings` | Org, billing, team, security, blueprint tabs |
| `/login`, `/register`, `/accept-invite` | `features/auth` | Better Auth + invites |
| `/trust`, `/docs/*` | public | Trust + MinTsifry docs (unauthenticated) |

**Primary entity:** `digital_employee`. Everything else is secondary.

---

## 4. HTTP API

### 4.1 Public REST API (`/api/v1/*`)

Auth: `Authorization: Bearer nx_live_<api_key>` (legacy `nx_` keys still accepted)  
Middleware: `src/features/public-api/middleware/authenticate-api-key.ts`  
Scopes: `src/features/public-api/lib/api-scopes.ts`  
**Contract (source of truth):** `public/openapi.yaml` → **`GET /api/docs`**  
**Human docs:** `/docs/api`  
**Typed client:** Orval — `npm run api:generate` → `src/features/public-api/generated/` (+ `sdk.ts`, mutator `lib/custom-fetch.ts`)  
**Validation deps:** direct `zod@^4`, `drizzle-zod` (request schemas can migrate onto Zod; handlers may still use manual JSON parse)

| Scope | Routes |
|-------|--------|
| `employees:read` | `GET /employees`, `GET /employees/:id` |
| `employees:write` | `POST /employees`, `PATCH/DELETE /employees/:id` |
| `sessions:read` | `GET /sessions`, `GET /sessions/:id` |
| `tasks:write` | `POST /employees/:id/tasks`, `POST /workforce/assign` |

Key bundles in Settings → Security: **Read-only**, **Workforce Operator**, **Admin Integration**.  
API access is **plan-gated**: Operator = read keys; Scale / Enterprise / Government = full. Free / Studio = no API.  
`api_key` columns: `scopes` (jsonb), `expires_at`, `last_used_at`.  
Hashes: HMAC-SHA256 with `API_KEY_PEPPER` stored as `hmac1:…` (legacy plain SHA-256 upgraded on first use).

| Method | Path | Required scope(s) |
|--------|------|-------------------|
| GET, POST | `/api/v1/employees` | read / write |
| GET, PATCH, DELETE | `/api/v1/employees/[id]` | read / write |
| POST | `/api/v1/employees/[id]/tasks` | `tasks:write` |
| GET | `/api/v1/sessions` | `sessions:read` |
| GET | `/api/v1/sessions/[id]` | `sessions:read` |
| POST | `/api/v1/workforce/assign` | `tasks:write` |

Responses include `requestId` (+ `X-Request-Id` header). Denied access → audit `api.access.denied`.

**Spec / testing:** [`docs/PUBLIC_API.md`](./PUBLIC_API.md) — architecture, Orval, probe (`npm run public-api:probe`).

**Add endpoint checklist:** update `public/openapi.yaml` → implement `src/app/api/v1/...` → `npm run api:generate` → refresh `/docs/api` + `PUBLIC_API.md`.

### 4.2 Email OTP (Better Auth + Resend)

**Plugin:** [Better Auth emailOTP](https://better-auth.com/docs/plugins/email-otp)  
**Sender:** [Resend](https://resend.com/docs/send-with-nextjs) — no server sends email without a provider; Better Auth only handles OTP logic, you wire `sendVerificationOTP` → Resend.

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key ([create](https://resend.com/docs/api-reference/api-keys/create-api-key)) |
| `RESEND_FROM_EMAIL` | Transactional auth sender, e.g. `Yuki Nakora NULLXES <noreply@nullxesdai.online>` |
| `RESEND_AUTOMATION_FROM_EMAIL` | Future Yuki outbound/automation sender, e.g. `Yuki Nakora <yukinakora@nullxesdai.online>` (not OTP) |
| `EMAIL_OTP_STEP_UP_ENABLED` | `true` only after domain DNS verified in Resend |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Client plugin mirror (same value) |

**Status (2026-06-30):** `nullxesdai.online` is verified in Resend. OTP step-up can be enabled with `EMAIL_OTP_STEP_UP_ENABLED=true` and `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED=true`.

The dashboard layout calls `requireEmailOtpVerified()`; the gate is controlled by environment flags. `ceo@nullxes.com` bypasses the post-login OTP gate.

Password recovery: `/login/forgot-password` → Better Auth `sendResetPassword` via Resend.

### 4.3 Internal / session APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET, POST | `/api/auth/[...all]` | Better Auth | All auth endpoints |
| POST | `/api/talk/brain-stream` | Session + org | NDJSON brain stream `{ employeeId, sessionId?, messages[] }` |
| POST | `/api/talk/session-abandon` | Session cookie | Mark session complete on abandon |
| POST | `/api/talk/telemetry` | Session | Client Talk telemetry |
| GET | `/api/talk/sessions/[sessionId]/metrics` | Session | Turn / session metrics |
| POST | `/api/talk/xai-voice/session` | Session | Start xAI Grok Voice session |
| POST | `/api/talk/xai-voice/execute-tool` | Session | Tool execution for xAI Voice |
| GET, POST, HEAD, OPTIONS | `/api/anam/[...path]` | User session | Anam API proxy (CORS) |
| GET | `/api/integrations/slack/authorize` | User | Slack OAuth start |
| GET | `/api/integrations/slack/callback` | User | Slack OAuth callback |
| GET | `/api/integrations/teams/authorize` | User | Teams OAuth start |
| GET | `/api/integrations/teams/callback` | User | Teams OAuth callback |
| GET | `/api/settings/export/[jobId]` | User | Export job download |
| GET | `/api/health/db` | `HEALTH_CHECK_TOKEN` in prod | DB probe (`x-health-token` or `Authorization: Bearer`) |
| GET, POST, PUT | `/api/inngest` | Inngest signing | Background job handler |
| GET | `/api/checkout` | User | Polar checkout |
| GET | `/api/portal` | User | Polar customer portal |
| POST | `/api/webhook/polar` | Polar signature | Billing webhooks |
| GET | `/api/docs` | Public | OpenAPI YAML |

### 4.4 Billing plans (Polar)

Source: `src/features/billing/config/plans.ts`

| Plan (DB) | UI | Monthly | Annual | Employees | Session | Talk min/mo | API |
|-----------|-----|---------|--------|-----------|---------|-------------|-----|
| free | Evaluation | $0 | — | 1 | 120 s | 30 | none |
| studio | Studio | $49 | $470 | 1 | 600 s | 180 | none |
| operator | Team | $200 | $1 920 | 3 | 1 200 s | 600 | read |
| scale | Scale | $600 | $5 760 | 10 | 1 800 s | 2 000 | full |
| enterprise | Enterprise | Contact sales | — | ∞ | ∞ | ∞ | full |
| government | Government | Contact sales | — | ∞ | ∞ | ∞ | full |

Self-serve Polar checkout: `studio` / `operator` (Team) / `scale` × `month|year` (separate products). Sync: `npm run polar:setup`. Legacy `super_pro` → `scale`.  
Talk minutes enforced via `assertTalkMinutesBudget`.

---

## 5. Feature deep-dives

### 5.1 Conversations

**Page:** `src/app/(dashboard)/dashboard/conversations/page.tsx`  
**UI root:** `src/features/conversations/`

```
conversations-screen.tsx     → page shell, CSS grid layout
conversations-inbox.tsx      → ALL / UNREAD / MENTIONS tabs, employee + thread list
conversations-chat-pane.tsx  → chat header, embeds EmployeeTalkChat
conversations-details-rail.tsx → DETAILS header + TalkAgentDetailsPanel
conversations-message-ui.tsx   → custom Stream message bubbles
conversations-theme.css        → Stream composer/message overrides
conversations-toolbar.tsx      → search, filter, + New conversation
```

**Chat integration:**

```tsx
<EmployeeTalkChat
  surface="conversations"
  embedded
  employeeId={...}
  threadId={threadId}  // null = main channel
  viewerName={...}     // from DB workspace.user
  viewerImage={...}
/>
```

- Main channel ID: `employee-talk-{employeeId}`
- Thread channel ID: `et-{employeeId}-{threadId}`
- Bot user: `digital-employee-{employeeId}`

### 5.2 Talk / Runtime Session

**Page:** `src/app/(dashboard)/dashboard/employees/[id]/talk/page.tsx`  
**Feature root:** `src/features/runtime-session/` (85+ files)

Key files:

| File | Role |
|------|------|
| `employee-talk-session.tsx` | Full live session (Anam, limits, rating) |
| `employee-talk-room.tsx` | Video stage + chat stack + inspector grid |
| `employee-talk-chat.tsx` | Stream Chat shell; `surface="talk"` \| `"conversations"` |
| `talk-message-ui.tsx` | Talk-page message renderer (flat list style) |
| `talk-chat-workspace.tsx` | Sessions sidebar + chat + agent details |
| `talk-inspector-panel.tsx` | Details / Activity / Notes tabs |
| `attach-talk-chat-pipeline.ts` | User message → brain → bot reply → voice → DB persist |
| `create-talk-chat-session.ts` | Stream channel provisioning |
| `connect-talk-chat-session.ts` | Client connection + mount retention |

**Brain pipeline:** Client POST `/api/talk/brain-stream` → `streamTalkBrainResponse` with tools `{ organizationId, employeeId, sessionId }`.

**Viewer identity (required):** `workspace.user.name`, `image`, `permissions.role` from DB — never hardcode "YOU".

### 5.3 HQ (3D Office)

**Page:** `src/app/(dashboard)/dashboard/hq/page.tsx`  
**Feature root:** `src/features/hq/`

Departments: `reception`, `sales`, `support`, `hr`, `analytics`, `executive`

| Capability | Key files |
|------------|-----------|
| 3D scene | `components/office/office-scene.tsx`, `office-employee.tsx` |
| Floor state | `queries/get-hq-state.ts`, `store/use-office-store.ts` |
| Chat → floor tasks | `lib/parse-hq-command.ts`, `actions/dispatch-hq-task-from-chat.ts` |
| Inline Talk overlay | HQ office click → chat overlay |
| Drag / pathfinding | `lib/office-layout.ts`, waypoint nav graph |

Table: `hq_task` — destination enum matches department slugs.

### 5.4 Digital Employees

**Entity:** `digital_employee` — `src/entities/digital-employee/schema.ts`  
**Feature:** `src/features/employees/`

Status enum: `draft | active | paused | archived`  
Runtime: `employee_runtime` (systemPrompt, temperature, maxTokens, sessionLimitSeconds)  
Providers: `employee_provider_config` (avatar/brain/session JSON)

Studio wizard provisions Anam avatar + ElevenLabs voice.

### 5.5 Analytics

**Feature:** `src/features/analytics/`  
Queries: sessions, messages, satisfaction, top employees/topics, department scope.  
Verify: `npm run analytics:verify`

### 5.6 Auth & Workspace

Better Auth config: `src/features/auth/config.ts`  
Server: `src/features/auth/server.ts`  
Bootstrap: `ensure-workspace.ts`, `provision-default-workspace.ts`  
Permissions: `src/features/workspace/` — `canViewEmployees`, `canOperateEmployees`, etc.

---

## 6. Server actions (index)

### Talk / runtime-session

| Action | File |
|--------|------|
| `connectTalkChatSessionAction` | `actions/connect-talk-chat-session.ts` |
| `listTalkThreadsAction` | `actions/list-talk-threads.ts` |
| `sendTalkChatBotMessageAction` | `actions/send-talk-chat-bot-message.ts` |
| `startTalkSessionAction`, `activateTalkSessionAction`, `completeTalkSessionAction` | `actions/employee-session.ts` |
| `createAnamTalkSessionToken` | `actions/create-anam-talk-session-token.ts` |
| `processTalkTurnAction`, `synthesizeTalkVoiceAction` | `actions/talk-voice-pipeline.ts` |

### HQ

| Action | File |
|--------|------|
| `dispatchHqTaskFromChatAction` | `actions/dispatch-hq-task-from-chat.ts` |
| `refreshHqStateAction` | `actions/refresh-hq-state.ts` |
| `assignEmployeeDepartmentAction` | `actions/assign-employee-department.ts` |
| `generateHqThoughtsAction` | `actions/generate-thoughts.ts` |

### Employees / knowledge / tasks

| Action | File |
|--------|------|
| `createEmployeeRecord`, `updateEmployeeAction`, `deleteEmployeeAction` | `features/employees/actions/` |
| `addEmployeeKnowledgeTextAction`, `addEmployeeKnowledgeUrlAction` | `actions/add-employee-knowledge.ts` |
| `scheduleEmployeeTaskAction` | task scheduling |
| `resolveApprovalAction` | `features/agent-approval/actions/` |

---

## 7. Database (Drizzle)

**Schema aggregator:** `src/shared/db/drizzle-schema.ts`  
**Generate:** `npm run db:generate` (drizzle-kit generate)  
**Migrate:** `npm run db:migrate` → `scripts/db-migrate.mjs` (Neon HTTP migrator)  
**Verify:** `npm run db:verify` (uses `-r ./scripts/mock-server-only.cjs` for Node scripts importing `server-only`)  
**Count:** 39 SQL files in `drizzle/`; latest `0038_billing_plans_studio_operator_scale.sql`  
**Build:** `npm run build` runs migrate then `next build`

| Table | Schema | Agent use |
|-------|--------|-----------|
| `digital_employee` | `entities/digital-employee/schema.ts` | Core identity |
| `employee_runtime` | `entities/runtime/schema.ts` | LLM config |
| `employee_provider_config` | `entities/provider-config/schema.ts` | Anam/Stream/ElevenLabs/xAI JSON |
| `employee_session` | `entities/session/schema.ts` | Talk sessions |
| `employee_session_message` | `entities/session-message/schema.ts` | Transcript + `streamMessageId` |
| `employee_session_turn` | session turn metrics | Talk latency / turn metrics (`0032`) |
| `knowledge_source`, `knowledge_chunk` | `entities/knowledge/schema.ts` | RAG (1536-dim embeddings) |
| `employee_task` | `entities/task/schema.ts` | Async agent tasks |
| `employee_mission`, `mission_schedule` | `entities/employee-mission`, `mission-schedule` | Missions + cron |
| `employee_scenario_session` | `entities/employee-scenario-session` | Scenario Mode |
| `character_preset`, `skill`, `tool_definition` | blueprint entities | Agent Blueprint catalog |
| `employee_character`, `employee_skill`, `employee_tool` | join tables | Per-employee blueprint |
| `hq_task` | `entities/hq-task/schema.ts` | HQ floor errands |
| `employee_work_event` | `entities/work-event/schema.ts` | Activity feed |
| `agent_approval_request` | `entities/agent-approval/schema.ts` | Human-in-the-loop |
| `employee_handoff` | `entities/employee-handoff/schema.ts` | Agent-to-agent handoff |
| `api_key` | `entities/api-key/schema.ts` | Public API keys (`nx_live_`, scopes jsonb) |
| `integration_connection` | `entities/integration-connection` | Slack/Teams OAuth |
| `organization_provider_credential` | provider credentials | Org-level LLM/provider secrets |
| `user_consent` | `entities/user-consent` | ToS / privacy consent |
| `organization` | `entities/organization/schema.ts` | billingPlan, dataRegion |
| Better Auth | `features/auth/schema.ts` | session, account, 2FA |

**Rule:** One iteration = one entity + one migration. No hypothetical tables.

---

## 8. Background jobs (Inngest)

Registered in `src/app/api/inngest/route.ts`:

**Tasks / sessions**
- `processEmployeeTaskReceived`, `processEmployeeFollowupDue`, `scanOverdueEmployeeTasks`
- `summarizeCompletedSession`, `expireStaleEmployeeSessionsJob`

**Knowledge / export / retention**
- `processKnowledgeSource`, `retentionPurge`, `processExportJob`

**Notifications**
- `notifySessionCompleted`, `notifyKnowledgeFailed`, `notifyEmployeeCreated`, `sendWeeklyDigest`

**Missions**
- `processEmployeeMissionStarted`, `runMissionSchedulesDaily`
- `processMissionHandoffStart`, `sendMissionOutboundOnApprove`

Local dev: `npm run inngest:dev` → `http://localhost:3000/api/inngest`

---

## 9. Environment variables

**Required core:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL (paste without wrapping quotes) |
| `BETTER_AUTH_SECRET` | Auth signing |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | App origin |

**Talk / Stream (required for chat):**

| Variable | Purpose |
|----------|---------|
| `STREAM_API_KEY`, `STREAM_SECRET_KEY` | Server Stream |
| `NEXT_PUBLIC_STREAM_API_KEY` | Client SDK |

**Brain (≥1 required):**

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Default brain + embeddings |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Google |
| `NULLXES_BRAIN_API_*` | Custom vLLM / NULLXES SDK endpoint |
| `XAI_API_KEY` | xAI Grok Voice (+ optional `XAI_VOICE_AGENT_*`) |

**Avatar / voice:**

| Variable | Purpose |
|----------|---------|
| `ANAM_API_KEY` (+ `_2`…`_11` pool) | Anam avatars (11 slots) |
| `ELEVENLABS_API_KEY` | Voice synthesis |

**Production ops / security:**

| Variable | Purpose |
|----------|---------|
| `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | Inngest |
| `DATA_ENCRYPTION_KEY` | Field encryption (required prod) |
| `API_KEY_PEPPER` | HMAC pepper for Public API key hashes (recommended prod) |
| `HEALTH_CHECK_TOKEN` | Protects `GET /api/health/db` in production |
| `RESEND_API_KEY` | Transactional email |
| `RESEND_FROM_EMAIL` | Sender on verified domain |
| `EMAIL_OTP_STEP_UP_ENABLED` | Post-login OTP gate |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Client emailOTP plugin flag |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | Billing |
| `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` | Optional OAuth |
| Slack / Teams OAuth vars | Integrations (see `.env.example`) |

Config helpers: `src/shared/config/env.ts`, `src/shared/config/provider-env.ts`

---

## 10. Verification scripts

Run with `npm run <script>` (most load `.env` via `--env-file`):

| Script | Domain |
|--------|--------|
| `db:migrate` | Apply SQL migrations (Neon HTTP) |
| `db:verify` | Database connection (`mock-server-only`) |
| `auth:verify`, `workspace:verify` | Auth + org |
| `employee:verify`, `employees-crud:verify` | Employee CRUD |
| `session:verify`, `runtime:verify` | Sessions + runtime |
| **`stream:verify`** | Stream credentials |
| **`talk-context:verify`** | Full talk context (needs `TALK_VERIFY_EMPLOYEE_ID`) |
| `knowledge:verify`, `knowledge-retrieval:verify` | RAG |
| `runtime-engine:verify`, `orchestration:verify` | Brain + routing |
| `agent-blueprint:verify` | Blueprint seed + CRUD (`mock-server-only`) |
| `analytics:verify` | Analytics queries |
| **`public-api:verify`** | API key auth + scope middleware (DB) |
| **`public-api:probe`** | Create probe keys + live HTTP smoke test |
| **`api-scopes:verify`**, **`email-otp:verify`** | Scope bundles + email OTP logic |
| `providers:status` | Provider deployment snapshot |
| `polar:setup`, `inngest:sync` | Billing products / Inngest sync |

Build gate: `npm run build` (= `db:migrate` && `next build`)

---

## 11. Agent orchestration modules

| Module | Path | Role |
|--------|------|------|
| Agent tasks | `features/agent-tasks/` | `createEmployeeTask`, enqueue |
| Agent router | `features/agent-router/` | Intent + workforce assignee scoring |
| Agent approval | `features/agent-approval/` | Human approval gate |
| Work events | `features/work-event/` | Audit trail |
| Runtime engine | `features/runtime-engine/` | Brain/tool execution |
| Knowledge retrieval | `features/knowledge-retrieval/` | RAG for Talk |
| Public API | `features/public-api/` | External integrations |

---

## 12. File map — where to start

| Task | Start here |
|------|------------|
| Fix Conversations UI | `src/features/conversations/components/` |
| Fix Talk live session | `src/features/runtime-session/components/employee-talk-room.tsx` |
| Change message rendering | `conversations-message-ui.tsx` or `talk-message-ui.tsx` |
| Change chat pipeline | `attach-talk-chat-pipeline.ts` |
| HQ floor behavior | `src/features/hq/components/office/` |
| Add public API endpoint | `src/app/api/v1/` + `public/openapi.yaml` + `npm run api:generate` + `/docs/api` |
| Schema change | one entity in `src/entities/` → `npm run db:generate` |
| i18n strings | `src/i18n/messages/en.json`, `ru.json` |

---

## 13. Iteration rules (do not violate)

From [`AGENTS.md`](../AGENTS.md):

- **NOT** a CRM, generic SaaS dashboard, or analytics-first product
- Black & white UI only — no blue/purple/green accent colors in product chrome
- One iteration = **one business entity + one migration + one verification path**
- Do not create tables for hypothetical features (billing expansions, notifications infra, etc.) unless explicitly requested
- shadcn/ui only — no custom component libraries
- Better Auth only — no NextAuth, Clerk, Supabase Auth
- Drizzle only — no Prisma

---

## 14. Related docs

- [PLATFORM_SCOPE.md](./PLATFORM_SCOPE.md) — sprint status matrix
- [DEPLOYMENT_RF.md](./DEPLOYMENT_RF.md) — Russia deployment
- [AGENTS.md](../AGENTS.md) — always-on agent rules
- [PUBLIC_API.md](./PUBLIC_API.md) — public API testing
- [AGENT_BLUEPRINT_2026-07-05.md](./AGENT_BLUEPRINT_2026-07-05.md) — Character / Skills / Tools blueprint
- [AGENT_DIGITAL_EMPLOYEES_2026-07-05.md](./AGENT_DIGITAL_EMPLOYEES_2026-07-05.md) — employee entity, studio, lifecycle
- [AGENT_TALK_2026-07-05.md](./AGENT_TALK_2026-07-05.md) — Talk brain-stream and tool gating
- [AGENT_MISSIONS_2026-07-05.md](./AGENT_MISSIONS_2026-07-05.md) — missions, schedules, skill_ids
- [AGENT_MOBILE_CLIENT_2026-07-04.md](./AGENT_MOBILE_CLIENT_2026-07-04.md) — mobile client brief
- [SCALING_2026-07-04.md](./SCALING_2026-07-04.md) — scaling guide

---

*Generated for NULLXES Digital Employees · 2026-06-26*
