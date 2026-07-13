# Tenant Row-Level Security (RLS)

Migration: `drizzle/0042_tenant_rls.sql`

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

**UPDATE / DELETE / INSERT** on published catalog rows is denied for tenants (domain layer also blocks).

## Helpers

- `withTenantContext(organizationId, fn)` — tenant request mutations
- `withRlsBypass(fn)` — workers / platform admin batch jobs

## Tables covered (P1)

`digital_employee`, `membership`, `api_key`, `audit_event`, `employee_mission`, `employee_task`, `organization_settings`, `employee_work_event`, `export_job`

## Apply

```bash
npm run db:migrate
```

## Next

Wire more request paths through `withTenantContext`. Remove reliance on default bypass once coverage is complete.
