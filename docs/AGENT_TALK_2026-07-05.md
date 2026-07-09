# NULLXES — Agent Brief: Talk Runtime

**Product:** NULLXES Digital Employees  
**Document date:** 2026-07-05 (patched 2026-07-09: xAI Voice, Talk minutes budget, prompt-layer order)  
**Audience:** AI coding agents changing **live Talk** — brain stream, prompt assembly, tool gating, avatar/voice pipeline, xAI Voice, SLA  
**Repo:** `dplatform`  
**Companion refs:** [`AGENTS.md`](../AGENTS.md), [`AGENT_REFERENCE_2026-06-26.md`](./AGENT_REFERENCE_2026-06-26.md), [`AGENT_BLUEPRINT_2026-07-05.md`](./AGENT_BLUEPRINT_2026-07-05.md), [`AGENT_MOBILE_CLIENT_2026-07-04.md`](./AGENT_MOBILE_CLIENT_2026-07-04.md), [`PLATFORM_SCOPE.md`](./PLATFORM_SCOPE.md)

Talk is the premium real-time path: user speech → STT → **NULLXES brain** → TTS → Anam avatar (or **xAI Grok Voice** as an alternate realtime plane). Anam runs **avatar-only** (`llmId` external); the platform owns cognition via `POST /api/talk/brain-stream` (Anam path) or xAI session APIs (Grok Voice path).

---

## 1. Surfaces & routes

| Surface | Route | Primary component |
|---------|-------|-------------------|
| Live Talk room | `/dashboard/employees/[id]/talk` | `src/features/runtime-session/components/employee-talk-room.tsx` |
| Conversations (text-first) | `/dashboard/conversations?employee=<uuid>` | `src/features/conversations/components/` (+ optional xAI Voice sheet) |
| HQ inline Talk | `/dashboard/hq` overlay | HQ office + Talk overlay |
| xAI Voice APIs | `/api/talk/xai-voice/session`, `/execute-tool` | `src/features/xai-voice/` + Talk UI |

Feature module root: `src/features/runtime-session/` (xAI: `src/features/xai-voice/`)

---

## 2. Brain-stream pipeline

### 2.1 End-to-end flow (voice mode)

```
User speech
  → Anam STT (end-of-speech)
  → client debounce (50–100 ms)
  → POST /api/talk/brain-stream
  → auth + rate limit + region check
  → buildTalkBrainRequest (parallel RAG + blueprint + scenario)
  → resolveTalkBrainTools (heuristic gating)
  → streamTalkBrainResponse (OpenAI / NULLXES brain)
  → NDJSON chunks to client
  → Anam TTS + face (voiceMode=anam)
     OR ElevenLabs PCM → Anam (voiceMode=elevenlabs)
```

Chat (Stream) path uses the same brain stream for agent replies via `attach-talk-chat-pipeline.ts` — text in, streamed text out.

### 2.2 HTTP route

`src/app/api/talk/brain-stream/route.ts`

| Step | Handler / service |
|------|-------------------|
| Parse body | `{ employeeId, sessionId?, scenarioSessionId?, messages[] }` |
| Validate | Last message must be `role: user` |
| Auth | `resolveTalkBrainAuth()` — session + employee org membership |
| Rate limit | `assertBrainStreamRateLimit()` |
| Trim history | `trimTalkHistory()` — voice turns only need recent context |
| Region | `checkForeignDataProcessingAllowed(orgId, "openai")` — RU org block |
| Build config | `buildTalkBrainRequest()` |
| Tools | `resolveTalkBrainTools(lastMessage, enabledToolSlugs)` |
| Stream | `streamTalkBrainResponse()` → `ReadableStream` NDJSON |

Runtime: `nodejs` (not edge).

### 2.3 Related Talk APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/talk/brain-stream` | LLM stream |
| POST | `/api/talk/telemetry` | Turn timing spans (SLA) |
| POST | `/api/talk/session-abandon` | Mark session complete on hang-up |
| * | `/api/anam/[...path]` | Anam HTTP proxy (CORS for web SDK) |

Session start: server action `startTalkSessionAction` (returns `sessionId`, Anam token, `voiceMode`).

---

## 3. Prompt layers (strict order)

Built in `src/features/runtime-session/services/build-talk-brain-request.ts`:

| # | Layer | Source | Function |
|---|-------|--------|----------|
| 1 | Global NULLXES brain wrapper | Shuten provider only | `composeShutenTalkSystemPrompt({ personaPrompt })` |
| 2 | Identity + role persona | `employee_runtime.system_prompt` + name/role/gender | `composeTalkSystemPrompt()` |
| 3 | Character block | Blueprint | `appendCharacterBlock(brainPrompt, blueprint.characterPromptBlock)` |
| 4 | Skills block | Blueprint active skills by priority | `appendSkillsBlock(layeredPrompt, blueprint.activeSkills)` |
| 5 | RAG knowledge | pgvector retrieval | `formatKnowledgeContext(retrieved)` appended with `\n\n` |
| 6 | Scenario overlay | Active scenario session | `appendScenarioOverlayToPrompt()` |

**Note:** For `brainProvider !== "nullxes"`, layer 1 is skipped; layer 2 becomes the base.

Parallel prefetch inside build (latency optimization):

- RAG (`talk.brain.rag`) — skipped entirely if `hasReadyKnowledge(employeeId)` is false
- Brain API config (`resolveBrainApiConfig`)
- Scenario session lookup
- Blueprint (`getEmployeeBlueprint`)

Employee context loader: `src/features/runtime-session/services/get-employee-talk-context.ts` — includes blueprint fields on `EmployeeTalkContext` type (`src/features/runtime-session/types/employee-talk-context.ts`).

---

## 4. Tool gating

### 4.1 Enabled slugs from DB

`getEmployeeBlueprint()` → `enabledToolSlugs: string[]`  
Only tools with `employee_tool.is_enabled = true` AND `tool_definition.is_active = true`.

Default slugs seeded per employee — see `DEFAULT_ENABLED_TOOL_SLUGS` in `system-catalog.ts`.

### 4.2 Latency heuristics (Talk mode)

`src/features/runtime-session/lib/resolve-talk-brain-tools.ts`:

| Tool slug | Gate function | Trigger intent |
|-----------|---------------|----------------|
| `search_web` | `shouldRunTalkWebSearch()` | User asks for current/web info (regex EN/RU) |
| Action tools (`TALK_ACTION_TOOLS`) | `shouldRunTalkToolLoop()` | Handoff, follow-up task patterns |

Heuristics live in `src/features/runtime-session/lib/should-run-talk-tool-loop.ts`:

- `WEB_SEARCH_PATTERN` — latest news, weather, "search the web", Russian equivalents
- `HANDOFF_PATTERN` — transfer to another employee
- `FOLLOW_UP_TASK_PATTERN` — remind me, create task

**Design rule:** Talk disables tools by default per turn unless the user message matches — keeps `talk.brain.tool_loop` within SLA.

### 4.3 Tool definitions

OpenAI function schemas: `src/features/agent-tools/lib/tool-definitions.ts`  
Execution loop: `streamTalkBrainResponse` + runtime engine handlers under `src/features/agent-tools/`

Destructive tools (`cancel_mission`, `restart_mission`) require approval flags on `tool_definition` — not in default employee enable list.

---

## 5. Anam external brain

| Concern | Owner |
|---------|-------|
| Face video, STT, TTS (anam mode) | Anam SDK |
| Persona / LLM on Anam | **Disabled** — external brain |
| System prompt, tools, RAG | NULLXES `brain-stream` |

Client pipeline: `src/features/runtime-session/lib/attach-talk-voice-pipeline.ts`  
Voice modes: `anam` | `elevenlabs` — selected at session start from provider config.

Do not configure Anam `llmId` with OpenAI keys in client; all model calls go through the platform route.

---

## 6. Talk SLA & telemetry

Thresholds: `src/features/runtime-session/lib/talk-sla.ts`  
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

Client posts spans to `/api/talk/telemetry` — no message text, auth + rate limit.

Perf logging: `src/features/runtime-session/lib/talk-perf-log.ts` → `measureTalkPerf()`.

### 6.1 UI pipeline states

Mirror in client: `idle` → `thinking` → `speaking` (`TalkPipelineState`).

---

## 7. Stream Chat integration

| Item | Value |
|------|-------|
| Main channel | `employee-talk-{employeeId}` |
| Thread channel | `et-{employeeId}-{threadId}` |
| Bot user | `digital-employee-{employeeId}` |

Hub component: `src/features/runtime-session/components/employee-talk-chat.tsx`  
Connect action: `connectTalkChatSessionAction` — platform-issued Stream tokens only.

---

## 8. Session limits & privacy

- Free tier: `employee_runtime.session_limit_seconds` (e.g. 120s) — enforced server-side
- RU orgs: foreign processor block before LLM call — surface 403 message, do not bypass
- Rate limits on brain-stream and telemetry — handle `429` gracefully

Privacy: `src/features/privacy/services/assert-foreign-data-processing.ts`

---

## 9. Agent implementation rules

1. **Read [`AGENTS.md`](../AGENTS.md) + [`AGENT_REFERENCE_2026-06-26.md`](./AGENT_REFERENCE_2026-06-26.md) before coding.**
2. **One entity = one migration = one verify path** — Talk changes rarely need schema; if adding session fields, one migration + runtime verify.
3. **NULLXES = digital workforce OS; primary entity = `digital_employee`** — every brain-stream call is scoped to `employeeId` + org auth.
4. **Brain split: Anam avatar-only, cognition in `/api/talk/brain-stream`** — never move prompt assembly into Anam persona or client-side OpenAI calls.
5. **Prompt layers order:** global (Shuten) → identity/role → character → skills → RAG → scenario — changing order requires updating `build-talk-brain-request.ts` and mission brain calls together.  
   Also enforce **Talk minutes/month** via `assertTalkMinutesBudget` (plan limits in `plans.ts`); session second caps remain separate.  
   Turn metrics: `GET /api/talk/sessions/[sessionId]/metrics` + table from migration `0032`.
6. **Tools: DB-enabled slugs + latency heuristics; never bypass org scope** — always intersect `enabledToolSlugs` with heuristic results; never inject tools from hardcoded lists in the route.
7. **File map with absolute paths** — route: `src/app/api/talk/brain-stream/route.ts`; build: `src/features/runtime-session/services/build-talk-brain-request.ts`; tools: `src/features/runtime-session/lib/resolve-talk-brain-tools.ts`; UI: `src/features/runtime-session/components/`.
8. **Anti-patterns:** do not duplicate prompt layers in chat pipeline vs voice pipeline; do not enable full tool catalog on every turn; do not log user message content in telemetry; do not mock SLA metrics in UI.

---

## 10. Quick links

| Resource | Path |
|----------|------|
| Agent rules | [`AGENTS.md`](../AGENTS.md) |
| Web technical reference | [`AGENT_REFERENCE_2026-06-26.md`](./AGENT_REFERENCE_2026-06-26.md) |
| Blueprint brief | [`AGENT_BLUEPRINT_2026-07-05.md`](./AGENT_BLUEPRINT_2026-07-05.md) |
| Mobile Talk SLA | [`AGENT_MOBILE_CLIENT_2026-07-04.md`](./AGENT_MOBILE_CLIENT_2026-07-04.md) §5 |
| Brain stream route | `src/app/api/talk/brain-stream/route.ts` |
| Build brain request | `src/features/runtime-session/services/build-talk-brain-request.ts` |
| Stream brain response | `src/features/runtime-session/services/stream-talk-brain-response.ts` |
| Tool resolver | `src/features/runtime-session/lib/resolve-talk-brain-tools.ts` |
| Tool heuristics | `src/features/runtime-session/lib/should-run-talk-tool-loop.ts` |
| Talk SLA thresholds | `src/features/runtime-session/lib/talk-sla.ts` |
| Voice pipeline | `src/features/runtime-session/lib/attach-talk-voice-pipeline.ts` |
| Chat pipeline | `src/features/runtime-session/lib/attach-talk-chat-pipeline.ts` |
| Talk room UI | `src/features/runtime-session/components/employee-talk-room.tsx` |
| Telemetry route | `src/app/api/talk/telemetry/route.ts` |
| OpenAI tool defs | `src/features/agent-tools/lib/tool-definitions.ts` |

---

*Document version: 2026-07-05 (patched 2026-07-09). Update when brain-stream contract, prompt order, xAI Voice, or SLA thresholds change.*
