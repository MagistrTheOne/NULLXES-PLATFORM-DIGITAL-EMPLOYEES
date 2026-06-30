DO $$ BEGIN
 CREATE TYPE "public"."session_message_feedback" AS ENUM('up', 'down');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "employee_session_message" ADD COLUMN IF NOT EXISTS "feedback" "session_message_feedback";
