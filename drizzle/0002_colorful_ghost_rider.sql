CREATE TYPE "public"."avatar_provider" AS ENUM('anam', 'nullxes', 'custom');--> statement-breakpoint
CREATE TYPE "public"."brain_provider" AS ENUM('openai', 'anthropic', 'google', 'nullxes');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TABLE "digital_employee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"role" text NOT NULL,
	"status" "employee_status" DEFAULT 'draft' NOT NULL,
	"avatar_provider" "avatar_provider" NOT NULL,
	"brain_provider" "brain_provider" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "digital_employee" ADD CONSTRAINT "digital_employee_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;