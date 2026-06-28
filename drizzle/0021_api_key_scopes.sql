ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api.access.denied';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api.task.enqueued';--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "scopes" jsonb DEFAULT '["employees:read","employees:write","sessions:read","tasks:write"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
