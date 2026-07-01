ALTER TABLE "employee_mission" ADD COLUMN IF NOT EXISTS "goal" text;
ALTER TABLE "employee_mission" ADD COLUMN IF NOT EXISTS "skills" jsonb DEFAULT '[]'::jsonb NOT NULL;
