ALTER TABLE "employee_session" ADD COLUMN IF NOT EXISTS "organization_id" uuid;--> statement-breakpoint
UPDATE "employee_session" AS es
SET "organization_id" = de."organization_id"
FROM "digital_employee" AS de
WHERE de."id" = es."employee_id"
  AND es."organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "employee_session" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employee_session"
    ADD CONSTRAINT "employee_session_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_session_organization_id_idx"
  ON "employee_session" ("organization_id");
