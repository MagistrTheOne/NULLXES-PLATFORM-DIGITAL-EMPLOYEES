# NULLXES Digital Employees — RF Deployment Guide

This document outlines deployment considerations for Russia (RU) data residency and enterprise security controls.

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
- Review audit events in Settings → Audit.

## Retention & compliance

- Daily retention purge runs via Inngest cron (`retention-purge-daily`, 03:00 UTC).
- `last_retention_run_at` is visible under Settings → General → Data & Privacy.
- Workspace owners may export data (Settings → Advanced) or delete organization data (owner-only action).

## Infrastructure checklist

| Item | Requirement |
|------|-------------|
| Database | Neon PostgreSQL in RF-approved region |
| `DATA_ENCRYPTION_KEY` | Required in production |
| `BETTER_AUTH_SECRET` | Strong random secret |
| `BETTER_AUTH_URL` | Production origin: `https://www.nullxesdai.online` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as `BETTER_AUTH_URL` in production |
| `RESEND_FROM_EMAIL` | Transactional auth sender, e.g. `Yuki Nakora NULLXES <noreply@nullxesdai.online>` |
| `RESEND_AUTOMATION_FROM_EMAIL` | Future outbound/automation sender, e.g. `Yuki Nakora <yukinakora@nullxesdai.online>` |
| `EMAIL_OTP_STEP_UP_ENABLED` | `true` only in environments where Resend delivery is configured |
| `NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED` | Same value as `EMAIL_OTP_STEP_UP_ENABLED` |
| Inngest | `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`; register app URL `https://<domain>/api/inngest` in Inngest Cloud |
| Rate limiting (scale) | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or Vercel `KV_REST_*`) — required before ~100 users |
| Talk SLA | `TALK_SLA_MODE=observe` (default prod), then `enforce` after calibration — see [SCALING_2026-07-04.md](./SCALING_2026-07-04.md) |
| Anam pool | `ANAM_API_KEY` … `ANAM_API_KEY_10` — fill 5–10 slots at scale |
| Public trust page | `/trust` — no authentication required |
| Public documentation (MinTsifry) | `/docs` — functional, installation, operation guides; no authentication required |

### Do not copy from local `.env` to Vercel

| Variable | Local only |
|----------|------------|
| `INNGEST_DEV=1` | Yes — never set in production |
| `NGROK_URL` | Yes — breaks Polar webhooks and invite links if set in prod |
| `BETTER_AUTH_URL=http://localhost:3000` | Yes — login will fail (CSP blocks localhost fetch) |

Provider keys to copy as-is: `OPENAI_API_KEY`, `ANAM_API_KEY`, `ELEVENLABS_API_KEY`, `STREAM_API_KEY`, `STREAM_SECRET_KEY`, `NEXT_PUBLIC_STREAM_API_KEY`, `POLAR_*`, `DATABASE_URL`.

Paste values **without** surrounding quotes. After changing env vars, trigger a **Redeploy** in Vercel.

Verify database connectivity: `GET /api/health/db` should return `{"ok":true}`.

**Scaling (10 → 1000+ users):** full ops checklist and transition triggers — [SCALING_2026-07-04.md](./SCALING_2026-07-04.md).

## Post-deploy verification

1. Apply migrations `drizzle/0016_sturdy_rafael_vega.sql` and `drizzle/0017_funny_natasha_romanoff.sql`.
2. Run secret encryption migration script on existing data.
3. Confirm Inngest functions registered: `export-job-process`, `retention-purge-daily`, `knowledge-ingestion-process-source`, `session-summary-completed`, `notifications-session-completed`, `notifications-knowledge-failed`.
4. Run `npm run talk-context:verify` and `npm run anam:backfill-external-brain` on production-like data when upgrading existing employees.
5. Enable 2FA on owner account and verify sensitive actions are blocked without it when policy is on.
6. Create and revoke an API key; confirm audit events appear.
