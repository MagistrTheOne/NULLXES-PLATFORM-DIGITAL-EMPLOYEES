# NULLXES — Agent Technical Reference

**Product:** NULLXES Digital Employees  
**Snapshot date:** 2026-06-26  
**Repo:** `dplatform`  
**Branch baseline:** `main` @ `cad7f30`

This document is the single source of truth for AI coding agents working in this repository. Read [`AGENTS.md`](../AGENTS.md) for product philosophy and iteration constraints.

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

## 2. Recent fixes (2026-06-26)

Commits agents should treat as current behavior:

| Commit | Area | Change |
|--------|------|--------|
| `cad7f30` | UI | shadcn preset `b1Hw82iEOu`, radix-maia, deps bump; NULLXES dark theme preserved |
| `680ba25` | Conversations | CSS Grid workspace (280 \| flex \| 300), aligned pane headers, search/composer polish |
| `968e534` | Conversations | `ConversationsMessageUI` — bubble messages, pill composer, `surface="conversations"` |
| `ef2142b` | Conversations | 3-column workspace, department labels, details rail |
| `d97727b` | Talk | Inspector panel (Details / Activity / Notes), status bar, video+chat layout |
| `bc3bf03` | Talk | Unified `TalkChatWorkspace`, DB-backed viewer name/image/role |
| `4e9f2c9` | Conversations | Enterprise inbox + chat + details layout |
| `c32b2ff` | Talk + HQ | Single empty chat state (no Stream duplicate), agent details panel |
| `4577acf` | Talk | Multi-thread Stream channels + sessions sidebar |
| `cb9490c`–`8d2abb3` | HQ | Floor errands, drag-to-place, waypoint nav, standups, inline Talk overlay |

---

## 3. Product surfaces (routes)

| Route | Feature module | Purpose |
|-------|----------------|---------|
| `/dashboard` | `features/overview` | Workforce overview |
| `/dashboard/employees` | `features/employees` | Digital employee roster |
| `/dashboard/employees/[id]` | `features/employees` | Employee profile, knowledge, lifecycle |
| `/dashboard/employees/[id]/talk` | `features/runtime-session` | Live Talk: Anam video + Stream chat + inspector |
| `/dashboard/conversations` | `features/conversations` | Text-first 3-pane workspace (`?employee=<uuid>`) |
| `/dashboard/hq` | `features/hq` | 3D office floor (`?department=<slug>`) |
| `/dashboard/analytics` | `features/analytics` | Session/message KPIs |
| `/dashboard/settings` | `features/settings` | Org, billing, team, security |
| `/login`, `/register` | `features/auth` | Better Auth flows |

**Primary entity:** `digital_employee`. Everything else is secondary.

---

## 4. HTTP API

### 4.1 Public REST API (`/api/v1/*`)

Auth: `Authorization: Bearer nx_live_<api_key>` (legacy `nx_` keys still accepted)  
Middleware: `src/features/public-api/middleware/authenticate-api-key.ts`  
Scopes: `src/features/public-api/lib/api-scopes.ts`  
OpenAPI: `public/openapi.yaml` → **`GET /api/docs`**

| Scope | Routes |
|-------|--------|
| `employees:read` | `GET /employees`, `GET /employees/:id` |
| `employees:write` | `POST /employees`, `PATCH/DELETE /employees/:id` |
| `sessions:read` | `GET /sessions`, `GET /sessions/:id` |
| `tasks:write` | `POST /employees/:id/tasks`, `POST /workforce/assign` |

Key bundles in Settings → Security: **Read-only**, **Workforce Operator**, **Admin Integration**.  
`api_key` columns: `scopes` (jsonb), `expires_at`, `last_used_at`.

| Method | Path | Required scope(s) |
|--------|------|-------------------|
| GET, POST | `/api/v1/employees` | read / write |
| GET, PATCH, DELETE | `/api/v1/employees/[id]` | read / write |
| POST | `/api/v1/employees/[id]/tasks` | `tasks:write` |
| GET | `/api/v1/sessions` | `sessions:read` |
| GET | `/api/v1/sessions/[id]` | `sessions:read` |
| POST | `/api/v1/workforce/assign` | `tasks:write` |

Responses include `requestId` (+ `X-Request-Id` header). Denied access → audit `api.access.denied`.

**Testing:** [`docs/PUBLIC_API.md`](./PUBLIC_API.md) — `npm run public-api:probe` (creates keys + HTTP smoke test).

### 4.2 Email OTP (Better Auth + Resend)

**Plugin:** [Better Auth emailOTP](https://better-auth.com/docs/plugins/email-otp)  
**Sender:** [Resend](https://resend.com/docs/send-with-nextjs) — no server sends email without a provider; Better Auth only handles OTP logic, you wire `sendVerificationOTP` → Resend.

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key ([create](https://resend.com/docs/api-reference/api-keys/create-api-key)) |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `NULLXES <yukinakora@nullxesdai.online>` |
| `EMAIL_OTP_STEP_UP_ENABLED` | `true` only after domain DNS verified in Resend |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Client plugin mirror (same value) |

**Status (2026-06-28):** OTP step-up **disabled** while `nullxesdai.online` DNS (MX/SPF) is Pending in Resend. Invites and notifications still use Resend when `RESEND_API_KEY` is set.

When enabled: uncomment `requireEmailOtpVerified()` in `(dashboard)/layout.tsx`.

### 4.3 Internal / session APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET, POST | `/api/auth/[...all]` | Better Auth | All auth endpoints |
| POST | `/api/talk/brain-stream` | Session + org | NDJSON brain stream `{ employeeId, sessionId?, messages[] }` |
| POST | `/api/talk/session-abandon` | Session cookie | Mark session complete on abandon |
| GET, POST, HEAD, OPTIONS | `/api/anam/[...path]` | User session | Anam API proxy (CORS) |
| GET | `/api/health/db` | None | DB probe |
| GET, POST, PUT | `/api/inngest` | Inngest signing | Background job handler |
| GET | `/api/checkout` | User | Polar checkout |
| GET | `/api/portal` | User | Polar customer portal |
| POST | `/api/webhook/polar` | Polar signature | Billing webhooks |

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
**Migrations:** `drizzle-kit generate` → `drizzle-kit migrate`

| Table | Schema | Agent use |
|-------|--------|-----------|
| `digital_employee` | `entities/digital-employee/schema.ts` | Core identity |
| `employee_runtime` | `entities/runtime/schema.ts` | LLM config |
| `employee_provider_config` | `entities/provider-config/schema.ts` | Anam/Stream/ElevenLabs JSON |
| `employee_session` | `entities/session/schema.ts` | Talk sessions |
| `employee_session_message` | `entities/session-message/schema.ts` | Transcript + `streamMessageId` |
| `knowledge_source`, `knowledge_chunk` | `entities/knowledge/schema.ts` | RAG (1536-dim embeddings) |
| `employee_task` | `entities/task/schema.ts` | Async agent tasks |
| `hq_task` | `entities/hq-task/schema.ts` | HQ floor errands |
| `employee_work_event` | `entities/work-event/schema.ts` | Activity feed |
| `agent_approval_request` | `entities/agent-approval/schema.ts` | Human-in-the-loop |
| `employee_handoff` | `entities/employee-handoff/schema.ts` | Agent-to-agent handoff |
| `api_key` | `entities/api-key/schema.ts` | Public API keys (`nx_live_` prefix, scopes jsonb) |
| `organization` | `entities/organization/schema.ts` | billingPlan, dataRegion |
| Better Auth | `features/auth/schema.ts` | session, account, 2FA |

**Rule:** One iteration = one entity + one migration. No hypothetical tables.

---

## 8. Background jobs (Inngest)

Registered in `src/app/api/inngest/route.ts`:

- `processEmployeeTaskReceived`, `processEmployeeFollowupDue`, `scanOverdueEmployeeTasks`
- `summarizeCompletedSession`, `expireStaleEmployeeSessionsJob`
- `processKnowledgeSource`, `retentionPurge`, `processExportJob`
- `notifySessionCompleted`, `notifyKnowledgeFailed`, `notifyEmployeeCreated`, `sendWeeklyDigest`

Local dev: `npm run inngest:dev` → `http://localhost:3000/api/inngest`

---

## 9. Environment variables

**Required core:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
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
| `NULLXES_BRAIN_API_*` | Custom vLLM endpoint |

**Avatar / voice:**

| Variable | Purpose |
|----------|---------|
| `ANAM_API_KEY` (+ `_2`…`_5` pool) | Anam avatars |
| `ELEVENLABS_API_KEY` | Voice synthesis |

**Production ops:**

| Variable | Purpose |
|----------|---------|
| `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | Inngest |
| `DATA_ENCRYPTION_KEY` | Field encryption (required prod) |
| `RESEND_API_KEY` | Transactional email (invites, OTP when enabled) |
| `RESEND_FROM_EMAIL` | Sender address on verified domain |
| `EMAIL_OTP_STEP_UP_ENABLED` | Post-login OTP gate (`false` until Resend domain verified) |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Client emailOTP plugin flag |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | Billing |

Config helpers: `src/shared/config/env.ts`, `src/shared/config/provider-env.ts`

---

## 10. Verification scripts

Run with `npm run <script>` (most load `.env` via `--env-file`):

| Script | Domain |
|--------|--------|
| `db:verify` | Database connection |
| `auth:verify`, `workspace:verify` | Auth + org |
| `employee:verify`, `employees-crud:verify` | Employee CRUD |
| `session:verify`, `runtime:verify` | Sessions + runtime |
| **`stream:verify`** | Stream credentials |
| **`talk-context:verify`** | Full talk context (needs `TALK_VERIFY_EMPLOYEE_ID`) |
| `knowledge:verify`, `knowledge-retrieval:verify` | RAG |
| `runtime-engine:verify`, `orchestration:verify` | Brain + routing |
| `analytics:verify` | Analytics queries |
| **`public-api:verify`** | API key auth + scope middleware (DB) |
| **`public-api:probe`** | Create probe keys + live HTTP smoke test |
| **`api-scopes:verify`**, **`email-otp:verify`** | Scope bundles + email OTP logic |
| `providers:status` | Provider deployment snapshot |

Build gate: `npm run build`

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
| Add public API endpoint | `src/app/api/v1/` + update `public/openapi.yaml` |
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

---

*Generated for NULLXES Digital Employees · 2026-06-26*
