# Beta Free Tier ops

## Seed

```bash
npm run db:migrate
npm run beta:seed
```

Publishes active employees from `ceo@nullxes.com` (or `PLATFORM_CATALOG_ORG_ID`) into `platform_employee_catalog`, and creates shell orgs:

| Slug | Name |
|------|------|
| `yandex-beta` | Yandex / Яндекс |
| `tinkoff-ba-b2b` | Tinkoff — Business Analytics & B2B / Тинькофф — бизнес-аналитика и B2B |

Partner orgs: `enterprise` plan, `dataRegion=ru`, no memberships yet. Invite owners via Settings → People.

## Evaluation (free) behavior

- Create / Edit / Delete employees: hidden + server denied
- Missions: create disabled
- Employee list: NULLXES catalog section (Adeline + Yuki) + empty custom section
- Catalog never counts toward plan seats; paid plans also see catalog by access tier
- Talk / chat: allowed on catalog employees visible to the plan; minutes count against caller org
- Soft concurrent cap: 12 open sessions per catalog employee

## Plan seats (custom only)

| Plan | Catalog | Custom seats |
|------|---------|--------------|
| Free | Adeline + Yuki | 0 |
| Starter | Adeline + Yuki | 2 |
| Studio | Starter catalog | 5 |
| Team | Extended | 10 |
| Scale | Full | 20+ |

## Sidebar billing

Shows live Polar price when subscribed; Evaluation shows `$0`; manual enterprise shows `Contact sales` (no “Assigned by NULLXES” in sidebar).

## Security (P0–P2)

- Published catalog employees are read-only for **other** tenants at the domain layer (Public API returns 403 on definition writes). The **home organization** that owns the employee retains full write access (tasks, knowledge, missions, edit).
- Tenant RLS: see `docs/RLS.md` (`0042_tenant_rls`).
- `/api/anam` requires Better Auth session or short-lived landing demo token; Anam API keys stay server-side.
- **No RU data-residency claim** until a dedicated RU database contour exists (VK Managed PG + object storage). `dataRegion=ru` on beta orgs is a product flag only until cutover.
