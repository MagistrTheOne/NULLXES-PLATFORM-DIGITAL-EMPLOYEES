ALTER TABLE "employee_session" ADD COLUMN "message_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "satisfaction_rating" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "first_response_ms" integer;--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "resolved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "escalated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_session" ADD COLUMN "primary_topic" text;