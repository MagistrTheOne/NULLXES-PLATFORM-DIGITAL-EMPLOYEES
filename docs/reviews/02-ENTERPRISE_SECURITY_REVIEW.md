# Enterprise Security Review

**Product:** NULLXES Digital Employees  
**Review type:** Static security review (no build, no install, no tests, no runtime)  
**Date:** 2026-07-16  
**Frameworks:** OWASP Top 10, OWASP API Security, MITRE ATT&CK (select techniques)  
**Out of scope here:** Deep AI prompt/tool/RAG analysis → see `03-AI_PLATFORM_SECURITY_REVIEW.md`. Ops/deploy → see `04-OPERATIONAL_READINESS_REVIEW.md`.

---

## 1. Score

| Metric | Score | Condition |
|--------|------:|-----------|
| **Security (release gate)** | **7.8 / 10** | Holds **only if all P0 items below are closed before public beta** |
| Residual risk if P0 ship open | ~6.0 | Do not claim 7.8 |

### Scoring rationale

The platform already has serious enterprise controls: nonce CSP, HSTS, CORP/COOP, Better Auth + 2FA hooks, API key pepper, IP allowlist, webhook signatures, Anam SSRF allowlist, rate-limit design with Redis fail-closed, field encryption, audit events, health fail-closed. P0 findings are concrete and fixable; they are not “missing security culture.” Closing them justifies **7.8**. Shipping without them does not.

---

## 2. Executive summary

Security engineering quality is high for a pre-beta SaaS. The gap to enterprise beta is not “no headers / no auth” — it is **defense-in-depth incomplete (RLS bypass default)**, **tool execution authorization hole**, **landing abuse/IP trust**, and **auth step-up defaults off**. Cloudflare readiness is documented and correct, but operationally brittle if CF edge rewrites are left on.

---

## 3. Confirmed P0 (must close before release for 7.8)

### P0-1 — Tenant RLS default bypass

**Evidence:** `docs/RLS.md`, `drizzle/0042_tenant_rls.sql` — `app.bypass_rls` defaults to `on` so Neon HTTP / existing code keeps working. Only a subset of hot paths use `withTenantContext`.

**Impact:** Application-layer org filters are the real boundary. One missed `organizationId` predicate becomes cross-tenant exposure (OWASP A01).

**Gate:** Wire critical read/write paths; document remaining bypasses; plan default-off for app DB role.

### P0-2 — Tool execute path without `enabledToolSlugs`

**Evidence:** `src/app/api/talk/xai-voice/execute-tool/route.ts` calls `executeAgentTool` with client-supplied `toolName`. Offer-time gating exists in `resolve-talk-brain-tools.ts`; execute-time gating does not.

**Impact:** Authenticated operator with `canOperateEmployees` can invoke tools beyond employee blueprint (OWASP API1 / broken function level authorization).

**Gate:** Central `assertToolAllowed(toolName, enabledSlugs)` inside `executeAgentTool` (and brain tool loop). Detail in AI Platform Security Review.

### P0-3 — Landing demo IP trust + cost abuse

**Evidence:** Landing routes use `x-forwarded-for` **first hop** (`adeline-demo/talk`, `brain-stream`, …). Trusted resolver `resolveTrustedClientIp` exists but is unused there.

**Impact:** Rate buckets spoofable → Anam/OpenAI/ElevenLabs spend abuse (ATT&CK-adjacent resource theft via public API).

**Gate:** Use `resolveTrustedClientIp` + platform quotas; prefer `CF-Connecting-IP` when behind Cloudflare.

### P0-4 — Landing brain reuses private Talk context builder

**Evidence:** `adeline-demo/brain-stream` → `buildTalkBrainRequest` → injects live missions/tasks via `formatLivePlatformStateContext` + RAG for Adeline employee.

**Impact:** Unauthenticated demo can surface home-org operational context into model context (data exposure). Full analysis in AI Platform Security Review — listed here as release-blocking security P0.

**Gate:** Separate landing brain builder without live org state / private RAG.

---

## 4. Confirmed High (should close before enterprise GA)

| ID | Issue | Evidence |
|----|--------|----------|
| H1 | Email verification / OTP step-up default **off** in `.env.example` | `REQUIRE_EMAIL_VERIFICATION=false`, `EMAIL_OTP_STEP_UP_ENABLED=false` |
| H2 | Bypass env lists for 2FA / OTP | `TWO_FACTOR_GATE_BYPASS_EMAILS`, `EMAIL_OTP_BYPASS_EMAILS` |
| H3 | `proxy.ts` soft gate = cookie presence only | Expected Better Auth pattern; real auth in pages/actions — needs complete Server Action auth matrix |
| H4 | CSP `connect-src 'self' https: wss:` very broad | `security-header-values.ts` |
| H5 | Redis not linked ⇒ in-memory rate limits per instance | `rate-limit.ts`, DEPLOYMENT_RF |
| H6 | Missing `frame-ancestors` in CSP (XFO DENY present) | `security-header-values.ts` |
| H7 | API route bodies largely unvalidated with Zod | Grep of `src/app/api/**` shows little schema validation |

---

## 5. Control inventory (strengths)

| Control | Status | Location |
|---------|--------|----------|
| CSP nonce + strict-dynamic | Present | `src/proxy.ts`, `security-header-values.ts` |
| HSTS / nosniff / XFO DENY / Referrer / Permissions-Policy | Present | same |
| COOP / CORP | Present | same |
| Better Auth + 2FA plugin | Present | `features/auth/config.ts` |
| API keys HMAC pepper | Present (prod fail-closed) | `features/security/services/api-key.ts` |
| Org IP allowlist (API) | Present | `authenticate-api-key.ts` |
| Trusted client IP helper | Present | `resolve-trusted-client-ip.ts` |
| Anam proxy host allowlist | Present | `anam-proxy-target.ts` |
| Polar webhook secret | Present | `api/webhook/polar` |
| T-Bank token verify | Present | `api/billing/tbank/notification` |
| Field encryption `DATA_ENCRYPTION_KEY` | Present | env assert + migrate scripts |
| Audit events | Present | `record-audit-event` |
| Health fail-closed | Present | `api/health/db` |
| Prod secret assert at boot | Present | `instrumentation.ts` |

---

## 6. Cloudflare security posture

Documented correctly in `docs/DEPLOYMENT_RF.md` and CSP comments:

- **Full (strict)** SSL only — Flexible causes redirect loops with Vercel.  
- **Must disable:** Email Obfuscation, Rocket Loader, Auto Minify, Bot Fight JS challenges (break nonce CSP / Talk).  
- **Must enable:** WebSockets; Cache Rules bypass for `/api/*`, dashboard, auth, RSC.  
- **WAF:** Block `x-middleware-subrequest` / enable managed Next.js CVE rules (Cloudflare docs, 2025–2026).  

**Conflict:** Aggressive CF “security” features vs app CSP is a known production-breaker. Treat CF checklist as a **security control**, not optional CDN polish.

Not verified from repo: live zone settings, WAF rule deployment, Bot Fight state.

---

## 7. OWASP mapping (static)

| OWASP | Finding |
|-------|---------|
| A01 Broken Access Control | RLS bypass default; tool execute allowlist gap |
| A02 Cryptographic Failures | Encryption key required in prod — good; pepper required — good |
| A03 Injection | XSS mitigated by CSP/React; SSRF constrained on Anam proxy |
| A05 Security Misconfiguration | Auth step-up defaults; CF edge features; broad connect-src |
| A07 Identification Failures | Soft cookie proxy; verification defaults off |
| API4 Unrestricted Resource | Landing demos + optional sessionId on brain paths |
| API8 Security Misconfig | Same as A05 |

---

## 8. Medium / low

- `?next=` set by proxy but login ignores it (dead open-redirect today; dangerous if “fixed” without allowlist).  
- Chart / Cloudflare email-off `dangerouslySetInnerHTML` with static markers — low risk.  
- Trust/docs public surfaces — intentional; ensure no secrets in corpus.  
- Image remotePatterns include broad `**.amazonaws.com` — review necessity.

---

## 9. Release gate checklist (Security)

- [ ] P0-1 RLS plan accepted + critical paths wired  
- [ ] P0-2 tool allowlist on execute  
- [ ] P0-3 trusted IP on all public demos  
- [ ] P0-4 landing brain facade (no live org state)  
- [ ] Prod: email verification + OTP step-up on; bypass emails empty  
- [ ] Upstash Redis linked; rate-limit fail-closed verified  
- [ ] Cloudflare checklist applied; WAF Next.js rules on  
- [ ] `API_KEY_PEPPER`, `DATA_ENCRYPTION_KEY`, `HEALTH_CHECK_TOKEN`, `BETTER_AUTH_SECRET` present  

**Only after this gate: Security score = 7.8.**

---

## 10. Verdict

Security foundations are real and above average. **Do not inflate current residual risk.** The **7.8** score is a **conditional enterprise release score**, not a claim that production is already safe with P0 open.
