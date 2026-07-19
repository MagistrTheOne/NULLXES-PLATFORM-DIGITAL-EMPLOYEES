# Public API v1 — Technical Specification

**Product:** NULLXES Digital Employees  
**Base path:** `/api/v1`  
**Contract (source of truth):** `public/openapi.yaml`  
**Live OpenAPI:** `GET /api/docs`  
**Human docs (platform):** `/docs/api`  
**Auth:** `Authorization: Bearer nx_live_...`  
**Updated:** 2026-07-19

---

## 0. Public visibility (probe)

| Surface | Public without login | Notes |
|---------|----------------------|--------|
| `/docs/api` | Yes | Human documentation |
| `GET /api/docs` | Yes | OpenAPI YAML (cacheable) |
| `/api/v1/*` | Reachable, **401 without Bearer** | Workforce data requires `nx_live_…` key + scopes + plan |

Docs/OpenAPI are intentionally public. Data endpoints are not open: no valid key ⇒ no payload. Dashboard Settings and Anam Key Pool remain session-gated.

---

## 1. Architecture decisions (locked)

| Decision | Choice |
|----------|--------|
| Public surface | Only `/api/v1/*` — Talk, Anam, Inngest, Polar, Better Auth are **not** public |
| Contract style | **Contract-first:** maintain `public/openapi.yaml`, implement Route Handlers to match |
| Typed client | **Orval** (`npm run api:generate`) → `src/features/public-api/generated/` |
| HTTP client | Native `fetch` + mutator `src/features/public-api/lib/custom-fetch.ts` (prefixes `/api/v1`, Bearer) |
| Validation stack | Direct deps: `zod@^4`, `drizzle-zod` — ready for request schemas; handlers may still use manual parse until migrated |
| Docs UI | Platform `/docs/api` + raw YAML at `/api/docs` |

```
public/openapi.yaml
        │
        ├─ GET /api/docs              (YAML for tools / Swagger consumers)
        ├─ /docs/api                  (human documentation in product)
        ├─ Orval → generated client   (npm run api:generate)
        └─ Route Handlers             src/app/api/v1/**
```

---

## 2. Endpoints

| Method | Path | Scope |
|--------|------|-------|
| `GET` | `/api/v1/employees` | `employees:read` |
| `POST` | `/api/v1/employees` | `employees:write` |
| `GET` | `/api/v1/employees/{id}` | `employees:read` |
| `PATCH` | `/api/v1/employees/{id}` | `employees:write` |
| `DELETE` | `/api/v1/employees/{id}` | `employees:write` |
| `POST` | `/api/v1/employees/{id}/tasks` | `tasks:write` |
| `GET` | `/api/v1/sessions` | `sessions:read` |
| `GET` | `/api/v1/sessions/{id}` | `sessions:read` |
| `POST` | `/api/v1/workforce/assign` | `tasks:write` |

---

## 3. Auth & scopes

Create keys in **Settings → Security** (org owner; 2FA if policy requires).

| Scope | Access |
|-------|--------|
| `employees:read` | List / get employees |
| `employees:write` | Create / update / delete employees |
| `sessions:read` | List / get Talk sessions |
| `tasks:write` | Queue employee tasks, workforce assign |

**Bundles:**

- **Read-only** — `employees:read`, `sessions:read`
- **Workforce Operator** — read + `tasks:write`
- **Admin Integration** — all scopes

**Plan gates:**

| Plan | API keys |
|------|----------|
| free / studio | none |
| operator | read scopes only |
| scale / enterprise / government | full |

**Pepper:** `API_KEY_PEPPER` → HMAC-SHA256 (`hmac1:`). Legacy SHA-256 hashes upgrade on first successful use. Legacy `nx_` keys still accepted with full scopes.

Middleware: `src/features/public-api/middleware/authenticate-api-key.ts`  
Scopes: `src/features/public-api/lib/api-scopes.ts`

---

## 4. Response envelope

Success:

```json
{
  "data": {},
  "requestId": "uuid"
}
```

Error:

```json
{
  "error": "Insufficient API key scope",
  "requestId": "uuid",
  "requiredScopes": ["employees:write"]
}
```

Header `X-Request-Id` mirrors `requestId`. Denied access → audit `api.access.denied`.

---

## 5. Typed client (Orval)

```bash
npm run api:generate
```

Import:

```ts
import { getEmployees, postEmployees } from "@/features/public-api/sdk";

const res = await getEmployees({
  headers: { Authorization: `Bearer ${apiKey}` },
  // optional absolute origin for server-side / mobile:
  // baseUrl: "https://www.nullxesdai.online",
} as RequestInit & { baseUrl?: string; apiKey?: string });
```

Mutator resolves paths under `/api/v1` and returns `{ data, status, headers }` (Orval fetch shape).

**When adding an endpoint:**

1. Update `public/openapi.yaml`
2. Implement `src/app/api/v1/.../route.ts`
3. Run `npm run api:generate`
4. Update `/docs/api` + this file if behavior changes

---

## 6. Testing

```powershell
npm run dev
$env:PUBLIC_API_PROBE_BASE_URL = "http://localhost:3000"
npm run public-api:probe
```

| Script | Purpose |
|--------|---------|
| `public-api:probe` | Creates scoped keys + HTTP smoke against every v1 route |
| `public-api:verify` | Middleware + DB (no HTTP) |
| `api-scopes:verify` | Scope bundle logic |

### Manual curl (PowerShell)

```powershell
$BASE = "http://localhost:3000"
$KEY = "nx_live_ВАШ_КЛЮЧ"

curl "$BASE/api/docs"
curl -H "Authorization: Bearer $KEY" "$BASE/api/v1/employees"

curl -X POST "$BASE/api/v1/employees" `
  -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" `
  -d '{"name":"Atlas","role":"Automation Engineer","description":"API test"}'

curl -H "Authorization: Bearer $KEY" "$BASE/api/v1/sessions?limit=10"

curl -X POST "$BASE/api/v1/workforce/assign" `
  -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" `
  -d '{"message":"Route to best sales employee","title":"Inbound lead"}'
```

---

## 7. Production checklist

- [ ] Plan allows API (Operator+ for read; Scale+ for write)
- [ ] Keys created in Settings → Security
- [ ] `API_KEY_PEPPER` set
- [ ] IP allowlist configured if required
- [ ] `BETTER_AUTH_URL` / public origin correct for clients
- [ ] OpenAPI reachable: `GET /api/docs`
- [ ] Human docs: `/docs/api`

---

*NULLXES Digital Employees · Public API v1*
