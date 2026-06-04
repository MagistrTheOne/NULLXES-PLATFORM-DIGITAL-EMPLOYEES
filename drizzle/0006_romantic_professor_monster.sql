CREATE TYPE "public"."employee_lifecycle_event_type" AS ENUM('created', 'activated', 'paused', 'archived', 'runtime_updated', 'knowledge_updated');--> statement-breakpoint
CREATE TABLE "employee_lifecycle_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"event_type" "employee_lifecycle_event_type" NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_lifecycle_event" ADD CONSTRAINT "employee_lifecycle_event_employee_id_digital_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_lifecycle_event" ADD CONSTRAINT "employee_lifecycle_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;