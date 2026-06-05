CREATE TABLE "organization_settings" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"website" text,
	"industry" text DEFAULT 'enterprise' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"date_format" text DEFAULT 'MMM d, yyyy' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"default_time_range_days" integer DEFAULT 7 NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"default_brain_provider" "brain_provider" DEFAULT 'openai' NOT NULL,
	"knowledge_processing" text DEFAULT 'auto' NOT NULL,
	"session_retention_days" integer DEFAULT 90 NOT NULL,
	"retention_policy_days" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;