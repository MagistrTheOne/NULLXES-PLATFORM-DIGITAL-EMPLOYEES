DO $$ BEGIN
  CREATE TYPE "employee_scenario_session_status" AS ENUM(
    'pending',
    'in_talk',
    'debrief_ready',
    'completed',
    'abandoned'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "employee_scenario_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "employee_id" uuid NOT NULL REFERENCES "digital_employee"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "template_id" text NOT NULL,
  "status" "employee_scenario_session_status" NOT NULL DEFAULT 'pending',
  "talk_session_id" uuid REFERENCES "employee_session"("id") ON DELETE SET NULL,
  "debrief" jsonb,
  "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "employee_scenario_session_org_user_idx"
  ON "employee_scenario_session" ("organization_id", "user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "employee_scenario_session_employee_idx"
  ON "employee_scenario_session" ("employee_id", "created_at" DESC);
