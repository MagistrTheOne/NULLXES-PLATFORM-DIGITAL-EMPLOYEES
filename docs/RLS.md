# Tenant Row-Level Security (RLS)

Migrations: `drizzle/0042_tenant_rls.sql`, `drizzle/0048_session_knowledge_rls.sql`

## Model

```text
withTenantContext(orgId)
  → SET LOCAL app.organization_id
  → SET LOCAL app.bypass_rls = off
  → RLS policies filter by org
```

When `app.bypass_rls` is unset or `on` (default for Neon HTTP / Inngest), policies allow all rows so existing code keeps working.

When `app.bypass_rls = off`, rows must match `app.organization_id`.

## Catalog exception

`digital_employee` **SELECT** also allows published `platform_employee_catalog` rows (Talk / list).

**UPDATE / DELETE / INSERT** on catalog employees is allowed for the **home org** only (matches app-layer `forbidCatalogMutation`). Non-home tenants are blocked by organization_id mismatch.

`knowledge_source` / `knowledge_chunk` **SELECT** allows home-org employees plus published catalog corpora. Writes require home-org ownership of the employee.

## Helpers

- `withTenantContext(organizationId, fn)` — tenant request mutations / hot reads
- `withRlsBypass(fn)` — workers / platform admin batch jobs / API key hash lookup

## Tables covered

P1 (`0042`): `digital_employee`, `membership`, `api_key`, `audit_event`, `employee_mission`, `employee_task`, `organization_settings`, `employee_work_event`, `export_job`

Hot paths (`0048`): `employee_session`, `employee_session_message`, `knowledge_source`, `knowledge_chunk`

## Wired through `withTenantContext`

- Live sessions, active session count, recent sessions
- Public API session list, append session message
- Employee update/delete
- Analytics: session / conversation / performance metrics
- Overview: employee session summaries, overnight work events
- Security: list API keys, create/count/revoke API keys, list audit events

`verifyApiKey` uses `withRlsBypass` for hash lookup (org unknown), then `withTenantContext` for `lastUsedAt` upgrade.

## Apply

```bash
npm run db:migrate
```

## Next

Wire remaining analytics leaf queries (timeseries, knowledge metrics, top employees). Plan default `bypass_rls=off` for the app DB role once coverage is complete.
