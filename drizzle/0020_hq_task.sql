DO $$ BEGIN
 CREATE TYPE "public"."hq_task_status" AS ENUM('pending', 'running', 'done', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."hq_task_destination" AS ENUM('reception', 'sales', 'support', 'hr', 'analytics', 'executive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hq_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"destination" "hq_task_destination" NOT NULL,
	"label" text NOT NULL,
	"status" "hq_task_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hq_task" ADD CONSTRAINT "hq_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hq_task" ADD CONSTRAINT "hq_task_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hq_task_org_status_idx" ON "hq_task" ("organization_id","status");
