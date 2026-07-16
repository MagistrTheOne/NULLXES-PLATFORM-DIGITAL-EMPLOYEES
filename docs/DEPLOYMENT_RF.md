# NULLXES Digital Employees — RF Deployment Guide

This document outlines deployment considerations for Russia (RU) data residency and enterprise security controls.

Last updated: **2026-07-16**

## Cloudflare proxy (RU access)

Goal: `User (RU) → Cloudflare (orange cloud) → Vercel → Neon`.

Vercel [does not recommend](https://vercel.com/kb/guide/cloudflare-with-vercel) a reverse proxy in front of the platform, but [supports Cloudflare as Verified Proxy Lite](https://vercel.com/docs/security/reverse-proxy) via the built-in `CF-Connecting-IP` header (all plans, no extra config).

### Current DNS (before Cloudflare)

| Host | Type | Target | NS |
|------|------|--------|----|
| `nullxesdai.online` | A | `216.198.79.1` | `dns1/dns2.registrar-servers.com` (Namecheap) |
| `www.nullxesdai.online` | CNAME | `6324365a24ea910e.vercel-dns-017.com` | same |

### Setup checklist

1. **Cloudflare** → Onboard a domain → `nullxesdai.online` → Free plan ([official onboard](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/)).
2. **DNS records** (proxied = orange cloud for web; gray for mail/verification):
   - `A` / `CNAME` apex → keep Vercel target (`216.198.79.1` or `cname.vercel-dns.com` with CNAME flattening)
   - `CNAME` `www` → `cname.vercel-dns.com` (or current `*.vercel-dns-017.com`)
   - MX / SPF / DKIM / DMARC → **DNS only** (gray cloud)
3. If **DNSSEC** is on at Namecheap → **turn off** before changing nameservers, then re-enable via Cloudflare after Active.
4. At **Namecheap** → Custom nameservers → paste the two Cloudflare NS Cloudflare shows.
5. Wait until zone status is **Active**.
6. **SSL/TLS** → Overview → **Full (strict)** ([docs](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)).
   - Never **Flexible** — causes `ERR_TOO_MANY_REDIRECTS` with Vercel ([KB](https://vercel.com/kb/guide/resolve-err-too-many-redirects-when-using-cloudflare-proxy-with-vercel)).
7. **Disable Edge HTML/JS rewrites + calm RU/global traffic** (required — breaks Talk + landing avatar demos):
   - **Security** → Settings (or Scrape Shield) → **Email Address Obfuscation → Off**
     - Symptom if left On: CSP blocks `/cdn-cgi/.../email-decode.min.js` (no nonce under `strict-dynamic`), React minified error **#418** (hydration text mismatch), UI stuck on “Connecting…” / “Starting…”.
   - **Speed** → Optimization → **Rocket Loader → Off**; **Auto Minify** all Off; **Mirage → Off**
   - **SSL/TLS** → **Full (strict)**; **Always Use HTTPS → On**; min TLS 1.2
   - **Security** level → **Essentially Off** (or Medium). Do **not** enable Under Attack Mode for normal ops.
   - **Bot Fight Mode → Off** (and JS detections off) — challenges inject `/cdn-cgi/challenge-platform/...` scripts that conflict with nonce CSP and can stall RU clients / Talk WebSockets.
   - **Browser Integrity Check → Off**; **Server-Side Excludes → Off**
   - **Caching** → Cache Level **Basic** + Cache Rule: bypass `/api/*`, `/dashboard*`, `/login*`, `/auth*`, `_rsc`, `/.well-known/*`
   - **Network** → WebSockets **On**, HTTP/3 On, IPv6 On, Pseudo IPv4 Off
   - Do **not** add country Block rules for RU (or any region you serve). Orange-cloud proxy is global anycast — RU and non-RU both hit the nearest CF PoP → Vercel.
   - Optional belt-and-suspenders in app: `Cache-Control: no-transform` + `<!--email_off-->` markers.
8. **Cache Rules** (recommended for Next.js App Router):
   - Bypass cache for `/.well-known/*`, HTML documents, `/api/*`, RSC / streamed paths
   - Do not set aggressive Edge TTL that overrides Vercel `Cache-Control`
9. **Vercel** → Project → Domains: confirm `nullxesdai.online` + `www` still Valid. Cloudflare Verified Proxy Lite is automatic (`CF-Connecting-IP`).
10. Verify: response header `cf-ray` present; View Source has **no** `email-decode.min.js`; site opens from RU without VPN; login / Talk / WebSockets / landing Adeline demo still work.
    - Console must **not** show React #418 or CSP on `cdn-cgi/.../email-decode.min.js`.
    - `connect-src 'none'` **report-only** lines from Cloudflare are noise — they do not block Talk (enforced CSP uses `connect-src 'self' https: wss: blob:`).

App rate limits / landing quotas resolve IP via `CF-Connecting-IP` first (`resolveTrustedClientIp` / `resolvePublicClientIpKey`).

### Zone Resources / Regional Services (what Free cannot do)

**Orange-cloud RU access ≠ data residency in Russia PoPs.**

| Capability | Free / Pro | Enterprise |
|------------|------------|------------|
| Proxy RU users via nearest CF PoP → Vercel | Yes (current setup) | Yes |
| Pin hostname to a Cloudflare **region** (Regional Hostnames) | No — API returns `forbidden` without Regional Services | Yes |
| Available account regions today | `eu`, `us`, `de`, `jp`, `kr`, `sg`, `ca`, `au`, … | Same catalog — **no `ru` key** on this account |

Do **not** expect Dashboard → Zone Resources → “Russia region” on Free. RF goal on this plan is **access from RU**, not **compute/storage affinity inside RF**. True data residency stays at Neon (`data_region`) + app controls below.

### Emergency eject

Toggle apex + `www` to **DNS only** (gray cloud) in Cloudflare DNS — traffic goes straight to Vercel within seconds.

## Data region

- Set `data_region` to `ru` on the `organization` record for RF-targeted tenants.
- User-level `data_region` on the `user` table supports per-user residency when required.
- Cross-region migration is stubbed in `src/features/security/services/org-migration-stub.ts`; production cutovers require coordinated export, key rotation, and compliance sign-off.

## Encryption

- Generate a production key: `npm run crypto:keygen`
- Configure `DATA_ENCRYPTION_KEY` (32-byte AES key, base64-encoded) in production.
- Migrate existing plaintext secrets: `npm run secrets:migrate`
- Encrypted fields use the `enc:v1:` prefix (webhook secrets, integration tokens, export download tokens).

## Authentication & API security

- Enable Better Auth two-factor (TOTP) for administrator accounts.
- Toggle **Require 2FA for admins** in Settings → Security when policy mandates it.
- Restrict API access with organization IP allowlists (Settings → Security).
- Create API keys in Settings → Security (plan-gated: Operator+ read, Scale+ full).
- Set `API_KEY_PEPPER` in production so key hashes use HMAC (`hmac1:`). Runtime fails closed without it.
- Optional: `EMAIL_OTP_BYPASS_EMAILS` (comma-separated). Empty in production = no OTP bypass.
- Review audit events in Settings → Audit.

## Retention & compliance

- Daily retention purge runs via Inngest cron (`retention-purge-daily`, 03:00 UTC).
- `last_retention_run_at` is visible under Settings → General → Data & Privacy.
- Workspace owners may export data (Settings → Advanced) or delete organization data (owner-only action).

## Infrastructure checklist

| Item | Requirement |
|------|-------------|
| Database | Neon PostgreSQL in RF-approved region |
| Migrations | Applied automatically on `npm run build` via `npm run db:migrate` (Neon HTTP → `scripts/db-migrate.mjs`). Uses `--env-file-if-exists=.env` so Vercel/CI can rely on platform env vars without a checked-in `.env`. 39 migrations through `0038`. |
| `DATA_ENCRYPTION_KEY` | **Required** in production (no BETTER_AUTH_SECRET fallback at runtime) |
| `API_KEY_PEPPER` | **Required** in production (Public API key HMAC hashing) |
| `HEALTH_CHECK_TOKEN` | Required in production — `GET /api/health/db` fails closed without it |
| `BETTER_AUTH_SECRET` | Strong random secret |
| `BETTER_AUTH_URL` | Production origin: `https://www.nullxesdai.online` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as `BETTER_AUTH_URL` in production |
| `RESEND_FROM_EMAIL` | Transactional auth sender, e.g. `Yuki Nakora NULLXES <noreply@nullxesdai.online>` |
| `RESEND_AUTOMATION_FROM_EMAIL` | Future outbound/automation sender, e.g. `Yuki Nakora <yukinakora@nullxesdai.online>` |
| `EMAIL_OTP_STEP_UP_ENABLED` | **Required `true` in production** (boot assert; Resend required) |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Same value as `EMAIL_OTP_STEP_UP_ENABLED` |
| `REQUIRE_EMAIL_VERIFICATION` | **Required `true` in production** (boot assert) |
| Bypass email lists | `TWO_FACTOR_GATE_BYPASS_EMAILS` / `EMAIL_OTP_BYPASS_EMAILS` **must be unset** in production |
| Inngest | `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`; register app URL `https://<domain>/api/inngest` in Inngest Cloud |
| Rate limiting | In-memory per instance (`src/shared/security/rate-limit.ts`) — Redis/Upstash removed |
| Talk SLA | `TALK_SLA_MODE=observe` (default prod), then `enforce` after calibration — see [SCALING_2026-07-04.md](./SCALING_2026-07-04.md) |
| Anam pool | `ANAM_API_KEY` … `ANAM_API_KEY_11` — verify with `npm run providers:status` |
| xAI Voice | `XAI_API_KEY` (+ optional `XAI_VOICE_AGENT_*`) |
| Public trust page | `/trust` — no authentication required |
| Public documentation (MinTsifry) | `/docs` — functional, installation, operation guides; no authentication required |

### Do not copy from local `.env` to Vercel

| Variable | Local only |
|----------|------------|
| `INNGEST_DEV=1` | Yes — never set in production |
| `NGROK_URL` | Yes — breaks Polar webhooks and invite links if set in prod |
| `BETTER_AUTH_URL=http://localhost:3000` | Yes — login will fail (CSP blocks localhost fetch) |

Provider keys to copy as-is: `OPENAI_API_KEY`, `ANAM_API_KEY` (+ pool), `XAI_API_KEY`, `ELEVENLABS_API_KEY`, `STREAM_API_KEY`, `STREAM_SECRET_KEY`, `NEXT_PUBLIC_STREAM_API_KEY`, `POLAR_*`, `DATABASE_URL`, `API_KEY_PEPPER`, `HEALTH_CHECK_TOKEN`.

Paste values **without** surrounding quotes. After changing env vars, trigger a **Redeploy** in Vercel.

Verify database connectivity (production):

```bash
curl -H "x-health-token: $HEALTH_CHECK_TOKEN" https://www.nullxesdai.online/api/health/db
```

Expect `{"ok":true}`.

**Scaling (10 → 1000+ users):** full ops checklist and transition triggers — [SCALING_2026-07-04.md](./SCALING_2026-07-04.md).

## Post-deploy verification

1. Confirm build applied pending migrations (`db:migrate` runs before `next build`). Do **not** manually apply single old SQL files (`0016`/`0017` instructions are obsolete).
2. Run secret encryption migration script on existing data if upgrading: `npm run secrets:migrate`.
3. Confirm Inngest functions registered, including mission workers: `process-employee-mission-started`, `run-mission-schedules-daily`, `process-mission-handoff-start`, `send-mission-outbound-on-approve`, plus knowledge / export / retention / notifications.
4. Run `npm run talk-context:verify` and `npm run anam:backfill-external-brain` on production-like data when upgrading existing employees.
5. Enable 2FA on owner account and verify sensitive actions are blocked without it when policy is on.
6. Create and revoke an API key; confirm audit events appear and peppered hashes (`hmac1:`) when `API_KEY_PEPPER` is set.
