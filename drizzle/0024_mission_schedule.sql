CREATE TABLE IF NOT EXISTS "mission_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_by_user_id" text NOT NULL,
	"type" "employee_mission_type" DEFAULT 'prospecting' NOT NULL,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"cron_expression" text DEFAULT '0 6 * * *' NOT NULL,
	"timezone" text DEFAULT 'Europe/Moscow' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."employee_mission_source" AS ENUM('manual', 'scheduled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "employee_mission" ADD COLUMN IF NOT EXISTS "source" "employee_mission_source" DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "employee_mission" ADD COLUMN IF NOT EXISTS "schedule_id" uuid;
--> statement-breakpoint
ALTER TABLE "employee_mission" ADD COLUMN IF NOT EXISTS "handoffs" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_mission" ADD CONSTRAINT "employee_mission_schedule_id_mission_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."mission_schedule"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_schedule_org_enabled_idx" ON "mission_schedule" ("organization_id", "enabled");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_mission_schedule_created_idx" ON "employee_mission" ("schedule_id", "created_at" DESC);
