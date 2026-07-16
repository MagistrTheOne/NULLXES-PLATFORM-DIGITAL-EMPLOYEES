# Operational Readiness Review

**Product:** NULLXES Digital Employees  
**Review type:** Static operational review (no build, no install, no tests, no runtime)  
**Date:** 2026-07-16  
**Scope:** Deploy · Rollback · Monitoring · Alerts · Costs · Incidents  
**Note:** HQ / Capsules / Inventory are assumed intentional product surface; ops cost for Anam/Talk applies to the whole platform including demos.

---

## 1. Score

| Metric | Score |
|--------|------:|
| **Production / Operational Readiness** | **8.0 / 10** |

### Scoring rationale

Deploy path, env fail-closed asserts, Cloudflare/Vercel runbooks, rate limits, billing budgets, Anam quotas, Inngest workers, retention, Talk SLA, and Sentry hooks are present and above typical pre-beta quality. Deductions: migrate-on-every-build, weak rollback/DB reverse story, alerts not as-code, single DB health endpoint, Redis dependency for hard multi-instance limits.

---

## 2. Executive summary

The repo is **ops-aware**: `DEPLOYMENT_RF.md` and `SCALING_2026-07-04.md` encode real production constraints (CF vs CSP, Redis, Talk SLA, provider pools). What is missing is **closed-loop operations** — paging rules, rollback of schema, kill switches for cost spikes, and multi-signal health. Score **8.0** assumes Redis + Sentry DSN + Inngest signing are configured in the target environment (not verifiable from git alone).

---

## 3. Deploy

| Item | Status | Evidence |
|------|--------|----------|
| Production build | `db:migrate && next build` | `package.json` |
| Migrator | Neon HTTP `scripts/db-migrate.mjs` | Prefer over drizzle-kit CLI on Windows |
| Env on Vercel | Documented; avoid copying localhost/INNGEST_DEV | `DEPLOYMENT_RF.md` |
| Boot asserts | `DATA_ENCRYPTION_KEY`, `API_KEY_PEPPER` | `instrumentation.ts` → `assertProductionSecretsConfigured` |
| Inngest | Signing key required in prod | `api/inngest/route.ts` |
| CI in repo | No `.github/workflows` found | Gap |
| `vercel.json` | Absent | Relies on Vercel project UI |

**Risk:** Every deploy applies migrations. Failed migrate fails deploy (safe-ish) but couples preview/prod cadence and lacks a staged migrate gate.

**Recommendation:** Release pipeline: migrate (prod) → deploy immutable build artifact; keep preview DBs separate.

---

## 4. Rollback

| Mechanism | In repo? | Notes |
|-----------|----------|-------|
| Cloudflare gray-cloud eject | Yes (docs) | Fast traffic bypass of CF |
| Vercel Instant Rollback | Assumed platform | Not configured in git |
| DB down-migrations | No | Forward-only migrate |
| Feature kill switches | Partial | `TALK_SLA_MODE=enforce` degrades tools; no global maintenance flag |
| Landing demo kill switch | No | Only rate limits |

**Gap:** No app+DB rollback playbook. For beta, document: (1) Vercel rollback, (2) CF eject, (3) freeze Inngest, (4) disable landing routes via env flag (to add).

---

## 5. Monitoring & observability

| Layer | Present | Evidence |
|-------|---------|----------|
| Sentry client/server/edge | Yes (DSN optional) | `instrumentation*.ts`, `sentry.*.config.ts` |
| Request error hook | Yes | `onRequestError` |
| Structured server logs | Yes | `server-log.ts` → JSON events |
| Talk SLA observe/enforce | Yes | `talk-sla.ts`; Sentry message mainly in enforce |
| Brain-stream spans | Yes | Sentry `startSpan` on brain-stream |
| Vercel Analytics dependency | Present | Wiring depth not fully audited |

**Gaps**

- Without DSN, Sentry is disabled.  
- Observe mode breaches → logs only, not necessarily paging.  
- No evidence of `withSentryConfig` source-map upload in `next.config.ts`.

---

## 6. Alerts

| Type | In repo? |
|------|----------|
| Sentry alert rules as code | No |
| PagerDuty / Opsgenie / Terraform | No |
| Checklist “set Sentry alert on Talk SLA” | Yes — `SCALING_2026-07-04.md` |
| Uptime on `/api/health/db` | Recommended in docs, not configured here |

**Cannot verify from repository:** whether alerts exist in Sentry/Vercel/Neon/Inngest dashboards or who is on-call.

**Minimum beta alert set (ops action, outside git):**

1. `/api/health/db` failing  
2. Sentry error rate spike  
3. Talk SLA breach (enforce)  
4. Inngest function failure rate  
5. 429 storm on Anam proxy / landing  
6. Neon connection / storage alarms  

---

## 7. Costs & quotas

### Strengths

| Control | Detail |
|---------|--------|
| Billing Talk minutes / session seconds | `plans.ts` + `assertTalkMinutesBudget` |
| Brain-stream RL | 40/min user-employee, 120/min org |
| Public API RL | 120/min per key |
| Anam proxy quotas | Platform + per-subject |
| Anam key pool failover | `anam-api-pool.ts` |
| Landing per-IP + platform caps | talk / brain / voice / synthesize |

### Risks

- Landing IP spoof (Security / AI reviews) undermines cost controls.  
- Without Redis, limits weaken under multi-instance.  
- No hard kill switch for landing when provider spend spikes.  
- Docs plan tables in SCALING may drift from `plans.ts` — ops must treat **code as source of truth**.

---

## 8. Incidents & resilience

| Capability | Status |
|------------|--------|
| `GET /api/health/db` + token | Present; fail-closed without token in prod |
| Broader readiness (Redis/Inngest/Anam) | CLI `providers:status`, not HTTP |
| Stale session expiry | Inngest cron `*/5` |
| Retention purge | Daily 03:00 UTC |
| Org export / delete | Documented product paths |
| CF under-attack mode | Explicitly discouraged for Talk |

**Incident gaps:** no maintenance mode env; no documented SEV runbook in repo beyond CF eject + deploy checklists.

---

## 9. Cloudflare + Vercel ops contract

Treat as production dependency:

1. SSL Full (strict), WebSockets on, HTTP/3 ok.  
2. Disable HTML/JS injectors (Email Obfuscation, Rocket Loader, Bot Fight challenges).  
3. Cache bypass for API / auth / dashboard / RSC / streams.  
4. WAF rules for Next.js middleware bypass classes.  
5. Emergency: gray-cloud DNS.

Misconfiguration here presents as **product outage** (Talk stuck, hydration #418), not slow CDN.

---

## 10. Enterprise ops score bridge

| Related score (sibling reviews) | Value |
|---------------------------------|------:|
| Architecture | 8.7 |
| Security (after P0 gate) | 7.8 |
| Enterprise readiness (product+controls) | 8.3 |
| AI Platform (after P0 gate) | 8.8 |
| **This doc — Operational** | **8.0** |

Enterprise **8.3** (sibling framing): trust center, audit, retention, 2FA, IP allowlist, API pepper, RF deployment docs, plan enforcement — assuming Security/AI P0 gates close. Not re-litigated here.

---

## 11. Pre-beta ops checklist

- [ ] Redis (Upstash) linked on Vercel  
- [ ] Sentry DSN + 5 alert rules above  
- [ ] Inngest Cloud synced; signing key set; `INNGEST_DEV` absent  
- [ ] Cloudflare checklist applied; smoke Talk + landing from RU  
- [ ] Health monitor on `/api/health/db`  
- [ ] Document rollback: Vercel + CF eject + freeze Inngest  
- [ ] Add env kill switch for landing demos (recommended)  
- [ ] Separate migrate from preview builds if possible  
- [ ] Reconcile SCALING plan table with `plans.ts`  

---

## 12. What cannot be verified statically

- Live Vercel/CF/Neon/Inngest/Sentry configuration  
- Actual on-call rota and MTTA/MTTR  
- Real Anam concurrent stream quotas  
- Whether migrate has ever failed mid-deploy in this project  
- Cost burn rate in production  

---

## 13. Verdict

**Operational readiness is strong for a documented serverless SaaS (8.0).** The platform is not “ops-blind.” Close the loop on alerts, Redis, rollback playbooks, and landing cost kill switches before calling the beta “enterprise-operated.”
