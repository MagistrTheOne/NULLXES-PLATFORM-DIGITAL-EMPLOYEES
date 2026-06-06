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
| Inngest | Signing key + event key for retention cron; local dev: `INNGEST_DEV=1` + `npm run inngest:dev` |
| Public trust page | `/trust` — no authentication required |

## Post-deploy verification

1. Apply migrations `drizzle/0016_sturdy_rafael_vega.sql` and `drizzle/0017_funny_natasha_romanoff.sql`.
2. Run secret encryption migration script on existing data.
3. Confirm Inngest functions registered: `export-job-process`, `retention-purge-daily`.
4. Enable 2FA on owner account and verify sensitive actions are blocked without it when policy is on.
5. Create and revoke an API key; confirm audit events appear.
