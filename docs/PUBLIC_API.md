# Public API — Testing Guide

**Base URL (local):** `http://localhost:3000/api/v1`  
**OpenAPI:** `GET /api/docs` → `public/openapi.yaml`  
**Auth:** `Authorization: Bearer nx_live_...`

---

## 1. Start server

```powershell
npm run dev
```

If port 3000 is busy, check which port Next.js prints (`Local: http://localhost:3001`) and set `PUBLIC_API_PROBE_BASE_URL` accordingly.

---

## 2. Auto-create keys + smoke test

Creates a probe organization, three scoped keys, and hits every `/api/v1` route:

```powershell
$env:PUBLIC_API_PROBE_BASE_URL = "http://localhost:3000"
npm run public-api:probe
```

Output includes:

| Variable | Scope bundle |
|----------|----------------|
| `ADMIN_INTEGRATION_KEY` | All scopes (`employees:read/write`, `sessions:read`, `tasks:write`) |
| `WORKFORCE_OPERATOR_KEY` | Read + tasks |
| `READ_ONLY_KEY` | Read employees + sessions only |

Keys stay active after the probe for manual testing.

**Other verify scripts:**

```powershell
npm run public-api:verify   # middleware + DB (no HTTP)
npm run api-scopes:verify   # scope bundle logic
npm run email-otp:verify    # OTP hash/expiry logic
```

---

## 3. Manual curl (PowerShell)

```powershell
$BASE = "http://localhost:3000"
$KEY = "nx_live_ВАШ_КЛЮЧ"

# OpenAPI
curl "$BASE/api/docs"

# List employees (employees:read)
curl -H "Authorization: Bearer $KEY" "$BASE/api/v1/employees"

# Create employee (employees:write — Admin Integration only)
curl -X POST "$BASE/api/v1/employees" `
  -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" `
  -d '{"name":"Atlas","role":"Automation Engineer","description":"API test"}'

# Sessions (sessions:read)
curl -H "Authorization: Bearer $KEY" "$BASE/api/v1/sessions?limit=10"

# Queue task (tasks:write)
$EMPLOYEE_ID = "uuid-сотрудника"
curl -X POST "$BASE/api/v1/employees/$EMPLOYEE_ID/tasks" `
  -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" `
  -d '{"title":"Smoke test","message":"Hello from external client"}'

# Workforce assign (tasks:write)
curl -X POST "$BASE/api/v1/workforce/assign" `
  -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" `
  -d '{"message":"Route to best sales employee","title":"Inbound lead"}'
```

Use `Invoke-RestMethod` if `curl` JSON escaping is awkward on Windows.

---

## 4. Scopes

| Scope | Routes |
|-------|--------|
| `employees:read` | `GET /employees`, `GET /employees/:id` |
| `employees:write` | `POST/PATCH/DELETE /employees/:id` |
| `sessions:read` | `GET /sessions`, `GET /sessions/:id` |
| `tasks:write` | `POST /employees/:id/tasks`, `POST /workforce/assign` |

**Preset bundles (Settings → Security):**

- **Read-only** — `employees:read`, `sessions:read`
- **Workforce Operator** — read + `tasks:write`
- **Admin Integration** — all four scopes

---

## 5. Response format

Success:

```json
{
  "data": { ... },
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

Header: `X-Request-Id` mirrors `requestId`.

---

## 6. Production

- Create keys in **Settings → Security** (requires org owner + 2FA if policy enabled).
- Set IP allowlist if configured.
- Replace `$BASE` with your deployment URL (`BETTER_AUTH_URL`).

Legacy keys with `nx_` prefix (pre-scopes) still work and receive full scope access.

---

*NULLXES Digital Employees · Public API v1*
