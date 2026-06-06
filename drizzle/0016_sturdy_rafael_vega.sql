CREATE TYPE "public"."data_region" AS ENUM('global', 'ru');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "data_region" "data_region";--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "data_region" "data_region" DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "require_two_factor_for_admins" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "api_ip_allowlist" text;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "last_retention_run_at" timestamp with time zone;