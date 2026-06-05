CREATE TYPE "public"."organization_billing_plan" AS ENUM('free', 'super_pro', 'enterprise', 'government');--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "billing_plan" "organization_billing_plan" DEFAULT 'free' NOT NULL;