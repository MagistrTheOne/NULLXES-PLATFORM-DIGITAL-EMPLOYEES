ALTER TABLE "organization_settings" ALTER COLUMN "notify_session_completed" SET DEFAULT false;--> statement-breakpoint
UPDATE "organization_settings" SET "notify_session_completed" = false WHERE "notify_session_completed" = true;
