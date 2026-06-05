ALTER TABLE "organization_settings" ADD COLUMN "notify_session_completed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "notify_employee_created" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "notify_knowledge_failed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "notify_weekly_digest" boolean DEFAULT false NOT NULL;