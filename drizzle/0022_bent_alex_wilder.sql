-- Enforce at most one open (created/active) session per employee+user.
-- This closes the check-then-act race in startEmployeeSession: the neon-http
-- driver has no interactive transactions, so the reuse SELECT + conditional
-- INSERT could create duplicate open sessions under concurrency.

-- Defensive cleanup: collapse any pre-existing duplicate open sessions before
-- creating the unique index (keep the most recent open one per pair, expire
-- the rest). Idempotent — a no-op once data is clean.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY employee_id, user_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM employee_session
  WHERE status IN ('created', 'active')
)
UPDATE employee_session AS s
SET status = 'expired',
    ended_at = COALESCE(s.ended_at, now())
FROM ranked
WHERE s.id = ranked.id
  AND ranked.rn > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employee_session_open_unique"
  ON "employee_session" USING btree ("employee_id", "user_id")
  WHERE "status" in ('created', 'active');
