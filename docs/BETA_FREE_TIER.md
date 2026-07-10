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
- Employee list: org employees + published platform catalog
- Talk / chat: allowed on catalog employees; minutes count against caller org
- Soft concurrent cap: 12 open sessions per catalog employee

## Sidebar billing

Shows live Polar price when subscribed; Evaluation shows `$0`; manual enterprise shows `Contact sales` (no “Assigned by NULLXES” in sidebar).
