# NULLXES — Agent Brief: Mobile Client

**Product:** NULLXES Digital Employees  
**Document date:** 2026-07-04 (`04-07-26`)  
**Audience:** AI coding agents implementing a **mobile client** against the existing web platform  
**Repo (platform):** `dplatform`  
**Companion refs:** [`AGENTS.md`](../AGENTS.md), [`AGENT_REFERENCE_2026-06-26.md`](./AGENT_REFERENCE_2026-06-26.md), [`PUBLIC_API.md`](./PUBLIC_API.md), [`PLATFORM_SCOPE.md`](./PLATFORM_SCOPE.md)

This document is the product/UX/API contract for a mobile app. **Mobile UI framework and local stack are chosen by the implementer** — do not invent a second backend or database.

---

## 1. Product identity

NULLXES is a **Digital Workforce Operating System**. The primary entity is the **`digital_employee`** (digital employee / digital assistant).

Every mobile surface must answer one of:

- Who are my digital employees?
- Can I talk to one (video / audio / text)?
- What did we discuss (chat history, files)?
- Who am I in this workspace (profile, org)?

It is **not** a generic CRM, social network, or analytics-first app. HQ 3D office and full Settings/Billing are **web-first**; mobile prioritizes roster, Talk, chats, and profile.

**Production web:** `https://www.nullxesdai.online`  
**Public OpenAPI:** `GET /api/docs` → `public/openapi.yaml`

---

## 2. Design system & visual style

Match the web product and the approved mobile concept (dark monochrome, glass-like panels, high-res avatar portraits).

### 2.1 Palette

| Token | Value | Usage |
|-------|--------|--------|
| Background | `#000000` (pure black) | App canvas, lists, chat |
| Surface / card | `white` at ~4–10% opacity, or near-black `#0A0A0A` | Cards, sheets |
| Border | `white` at ~8–12% opacity | Dividers, card outlines |
| Primary text | `#FFFFFF` | Names, titles |
| Secondary text | `white` ~50–60% | Roles, timestamps, captions |
| Muted text | `white` ~35–40% | Hints, empty states |
| Online | Green accent (subtle, not neon flood) | Status pill `ONLINE` |
| Destructive | Red (end-call, log out) | Hang up, logout only |

**No brand accent colors** in product UI (no purple/blue marketing gradients on operational screens). Logo mark is a stylized **X**.

### 2.2 Typography

| Role | Web reference | Mobile guidance |
|------|---------------|-----------------|
| Display / headings | Figtree | Bold, tight tracking on splash and section titles |
| Body / UI | Inter | Medium for names, regular for body |
| Mono (rare) | Geist Mono | IDs, technical labels only |

Copy tone: short, operational English (and `ru` when locale is Russian). Prefer “Talk”, “Employees”, “Chats”, “Profile” over marketing fluff on nav.

### 2.3 Layout patterns (from concept screens)

| Screen | Pattern |
|--------|---------|
| Splash / welcome | Centered X logo, product name, one-line tagline |
| Employees | Top filter tabs (`ALL` / `ACTIVE` / `ARCHIVED`), list of avatar + name + role + `ONLINE`, bottom nav |
| Talk | Full-bleed avatar video/portrait, overlay transcript, mode tabs (`AUDIO` / `TEXT` / `NOTES`), bottom controls: mute mic, video toggle, red end-call |
| Chat | Threaded bubbles, timestamps, file attachment cards (name + size), composer |
| Profile | Avatar, display name, role, email; grouped settings rows; company block; full-width **LOG OUT** |
| Directory teaser | Vertical avatar stack + “and more…” (marketing/onboarding only) |

### 2.4 Bottom navigation (mobile shell)

Three primary tabs (concept):

1. **Employees** — roster / management  
2. **Chats** — text conversations  
3. **Profile** — account & preferences  

Talk is **not** a tab; it is a full-screen flow opened from an employee card or chat.

### 2.5 Motion & feedback

- Splash: short, calm fade (no playful bounce).
- List: instant; pull-to-refresh allowed.
- Talk: pipeline states `idle` → `thinking` → `speaking` (mirror web `TalkPipelineState`).
- Never block UI on telemetry or analytics.

### 2.6 Assets

- Employee avatars: use platform `previewUrl` / Anam preview when present; fallback monogram on black.
- Do not ship placeholder stock photos as “live” employees.

---

## 3. Feature map (web → mobile)

Legend: **MVP** = ship first · **Later** = after MVP · **Web-only** = do not port unless explicitly requested.

| Capability | Web surface | Mobile | Priority |
|------------|-------------|--------|----------|
| Auth (email/password, optional OAuth) | `/login`, `/register` | Login / register / session restore | **MVP** |
| Employee roster | `/dashboard/employees` | Employees tab + filters | **MVP** |
| Employee detail (read) | `/dashboard/employees/[id]` | Detail sheet or screen | **MVP** |
| Live Talk (avatar + voice) | `/dashboard/employees/[id]/talk` | Full-screen Talk | **MVP** |
| Text chat (Stream) | `/dashboard/conversations` + Talk chat | Chats tab + thread | **MVP** |
| Profile / logout | Settings partial | Profile tab | **MVP** |
| Session limits / free tier | Talk session limits | Enforce server limits; show remaining time | **MVP** |
| Scenario Mode | `/scenarios`, debrief | Start scenario → Talk → debrief | **Later** |
| Knowledge upload | Employee detail | Upload / list sources | **Later** |
| Create employee / studio | Create wizard | Simplified create or deep-link to web | **Later** |
| Missions | `/dashboard/missions` | Optional list | **Later** |
| Analytics | `/dashboard/analytics` | Optional KPI strip | **Later** |
| Team / billing / API keys | Settings | Deep-link to web or omit | **Web-only** |
| HQ 3D office | `/dashboard/hq` | Omit | **Web-only** |
| Admin Anam tools | `/dashboard/admin/anam` | Omit | **Web-only** |

### 3.1 Screen inventory (concept-aligned)

1. **Welcome** — branding splash → auth or home.  
2. **Employees** — `ALL` / `ACTIVE` / `ARCHIVED`; row: avatar, name, role, online.  
3. **Talk** — video/audio/text modes; mic / video / end; live transcript line.  
4. **Chat** — messages, attachments (e.g. PDF card), composer.  
5. **Profile** — user identity, settings groups, company, logout.  
6. **Directory teaser** — optional onboarding carousel of employees.

---

## 4. Backend contract (do not fork)

Mobile is a **client of the existing platform**. Source of truth remains:

| Layer | Platform choice |
|-------|-----------------|
| App server | Next.js 16 App Router on Vercel |
| Database | Neon PostgreSQL + Drizzle |
| Auth | Better Auth |
| Chat transport | Stream Chat |
| Avatar / live face | Anam AI (browser SDK on web; mobile must use supported Anam integration path) |
| Brain / LLM | Platform `brain-stream` (OpenAI / org credentials / NULLXES brain) |
| Jobs | Inngest (server-side only) |

**Rules for agents:**

- Do **not** create a parallel Postgres, Firebase-as-source-of-truth, or duplicate employee CRUD on the device.
- Do **not** call OpenAI / Anam / ElevenLabs with secrets embedded in the app binary.
- Prefer **session-authenticated** user APIs for the interactive app; use **public API keys** only for machine integrations, not end-user login.

### 4.1 Public REST API (`/api/v1/*`)

Auth: `Authorization: Bearer nx_live_<key>` (legacy `nx_` accepted).  
Scopes: `employees:read|write`, `sessions:read`, `tasks:write`.  
Docs: [`PUBLIC_API.md`](./PUBLIC_API.md), OpenAPI at `/api/docs`.

| Method | Path | Scope |
|--------|------|--------|
| GET, POST | `/api/v1/employees` | read / write |
| GET, PATCH, DELETE | `/api/v1/employees/[id]` | read / write |
| POST | `/api/v1/employees/[id]/tasks` | `tasks:write` |
| GET | `/api/v1/sessions` | `sessions:read` |
| GET | `/api/v1/sessions/[id]` | `sessions:read` |
| POST | `/api/v1/workforce/assign` | `tasks:write` |

Use for automation and limited roster/session reads. **Interactive Talk and Stream chat require a user session**, not only an API key.

### 4.2 Session / Talk APIs (user session)

| Method | Path | Purpose |
|--------|------|---------|
| `*` | `/api/auth/[...all]` | Better Auth (login, session, OAuth) |
| POST | `/api/talk/brain-stream` | NDJSON brain stream: `{ employeeId, sessionId?, scenarioSessionId?, messages[] }` |
| POST | `/api/talk/telemetry` | Client turn timings (SLA); no message text |
| POST | `/api/talk/session-abandon` | Mark session complete on abandon |
| GET/POST/… | `/api/anam/[...path]` | Anam HTTP proxy (web CORS); mobile may use Anam SDK differently |

Talk session start on web uses server actions (`startTalkSessionAction`) returning `sessionId`, Anam `sessionToken`, and `voiceMode` (`anam` | `elevenlabs`). Mobile needs an equivalent **HTTP-exposed** session bootstrap if actions are not callable from the app — implement as a thin route on the platform when building mobile, do not invent a second token issuer.

### 4.3 Stream Chat

- Main channel: `employee-talk-{employeeId}`
- Thread channel: `et-{employeeId}-{threadId}`
- Bot user: `digital-employee-{employeeId}`
- Connect with tokens issued by the platform (web: `connectTalkChatSessionAction`). Mobile must obtain Stream credentials from the **platform**, never hardcode Stream secrets.

### 4.4 Primary data model (read-only awareness)

| Entity | Notes |
|--------|--------|
| `digital_employee` | `draft \| active \| paused \| archived` |
| `employee_runtime` | Prompt, temperature, session limit seconds |
| `employee_provider_config` | Avatar / brain / voice provider JSON |
| `employee_session` | Talk sessions, duration, messages |
| `employee_scenario_session` | Scenario Mode overlay + debrief |
| Organization / membership | Workspace permissions |

Mobile displays **status** and **provisioning readiness** (avatar/brain/voice `ready` vs `failed`); it does not run Inngest provisioning.

---

## 5. Talk architecture (latency-critical)

Web pipeline (mobile must preserve the same logical stages):

```
User speech → Anam STT → end-of-speech
  → client debounce (50–100 ms)
  → POST /api/talk/brain-stream
  → auth + optional RAG + LLM stream
  → chunks → Anam TTS + face (voiceMode=anam)
     or full text → ElevenLabs PCM → Anam (voiceMode=elevenlabs)
```

Persona is **avatar-only** on Anam (`llmId` external); **NULLXES owns the brain**.

### 5.1 Talk SLA (real timings only)

Source: `src/features/runtime-session/lib/talk-sla.ts`  
Mode: `TALK_SLA_MODE` = `off` | `observe` (prod default) | `enforce`

| Span | Warn (ms) | Breach (ms) |
|------|-----------|-------------|
| `talk.turn.e2e` | 2000 | 3500 |
| `talk.turn.debounce` | 120 | 200 |
| `talk.turn.brain_rtt` | 1200 | 2500 |
| `talk.brain.build` | 300 | 500 |
| `talk.brain.rag` | 250 | 400 |
| `talk.brain.ttfb` | 800 | 1500 |
| `talk.brain.tool_loop` | 1000 | 3000 |
| `talk.session.start` | 2000 | 4000 |

Mobile should POST turn spans to `/api/talk/telemetry` (auth + rate limit). **No mock KPIs** in UI.

North-star UX: **time to first avatar audio** after user stops speaking — target feel **~1.5–2.5 s** without VPN; VPN may add hundreds of ms per hop.

### 5.2 Talk UI states

Mirror web:

- `idle` — listening / ready  
- `thinking` — brain generating  
- `speaking` — avatar speaking  

Controls: mute mic, toggle video (if applicable), end call (red). Tabs: **AUDIO** / **TEXT** / **NOTES** (notes can be local or session notes later).

---

## 6. Auth & security (mobile)

- Single auth system: **Better Auth** on the platform.
- Prefer secure storage for session/refresh tokens (platform-native keystore).
- Do not store API keys for end users in the app.
- Respect org `dataRegion` (`global` | `ru`): RU orgs may block foreign processors (OpenAI, Anam, etc.) — surface platform error messages, do not bypass.
- Rate limits exist on brain-stream and telemetry; handle `429` calmly.
- Field encryption and API key peppering are **server-side**; mobile never decrypts provider secrets.

---

## 7. i18n

Web locales: **`en`**, **`ru`** (`next-intl`).  
Mobile should support the same two locales for MVP strings (nav, Talk, errors). Default follows device locale with fallback to `en`.

---

## 8. Agent implementation rules

1. **Read this doc + `AGENTS.md` + `AGENT_REFERENCE_2026-06-26.md` before coding.**  
2. **Stack is free** — Kotlin/Compose, SwiftUI, Flutter, RN, etc. are implementer choices; document the choice in the mobile repo README.  
3. **Platform remains source of truth** — extend `dplatform` APIs when mobile needs a missing HTTP surface; do not duplicate business logic in the app.  
4. **Style is non-negotiable** — pure black, monochrome, no random accent themes.  
5. **Primary entity is `digital_employee`** — every feature flows from employees.  
6. **No fake metrics** — analytics and SLA only from real measurements.  
7. **Talk is the premium path** — optimize for latency and clear pipeline states.  
8. **Web-only surfaces stay web-only** unless product explicitly expands scope.  
9. **Secrets stay on server** — Anam/OpenAI/Stream server keys never in the mobile binary.  
10. **Commits** — platform changes in `dplatform`; mobile app lives in its own repo or monorepo package, not mixed into unrelated web UI refactors.

---

## 9. Suggested delivery phases (stack-agnostic)

| Phase | Deliverable |
|-------|-------------|
| **P0** | Auth, employees list (filters), profile + logout |
| **P1** | Stream text chat (list + thread + attachments display) |
| **P2** | Talk full-screen (session start, brain stream, avatar media, controls, telemetry) |
| **P3** | Scenario Mode, knowledge list, push notifications |
| **P4** | Create-employee lite or web handoff; polish offline cache |

---

## 10. Platform touchpoints agents may need to add

When mobile cannot call Server Actions, prefer thin Route Handlers on the platform:

| Need | Suggested direction |
|------|---------------------|
| User session for native | Better Auth cookie/bearer patterns supported by mobile HTTP client |
| Start Talk | HTTP wrapper around `startTalkSessionAction` |
| Stream token | HTTP wrapper around `connectTalkChatSessionAction` |
| Employee list for user | Session-scoped list (not only API-key `/api/v1`) if product requires member-only data |

Any such addition belongs in `dplatform` with auth, rate limits, and audit consistent with existing public/session APIs.

---

## 11. Out of scope for this brief

- Choosing Android/iOS framework or local DB library.  
- Replacing Neon, Better Auth, Stream, or Anam on the server.  
- Porting HQ 3D, full Settings, billing UI, or admin tools.  
- Mock dashboards or fabricated ONLINE status — online should reflect real session/presence when available, otherwise omit or show last-known provisioning state.

---

## 12. Quick links

| Resource | Path |
|----------|------|
| Agent rules | [`AGENTS.md`](../AGENTS.md) |
| Web technical reference | [`AGENT_REFERENCE_2026-06-26.md`](./AGENT_REFERENCE_2026-06-26.md) |
| Public API testing | [`PUBLIC_API.md`](./PUBLIC_API.md) |
| Scope matrix | [`PLATFORM_SCOPE.md`](./PLATFORM_SCOPE.md) |
| Talk SLA thresholds | `src/features/runtime-session/lib/talk-sla.ts` |
| Talk voice pipeline | `src/features/runtime-session/lib/attach-talk-voice-pipeline.ts` |
| Brain stream | `src/app/api/talk/brain-stream/route.ts` |
| Telemetry | `src/app/api/talk/telemetry/route.ts` |
| OpenAPI | `public/openapi.yaml` |

---

*Document version: 2026-07-04. Update this file when mobile MVP scope or platform mobile APIs change; keep stack-specific details in the mobile repository.*
