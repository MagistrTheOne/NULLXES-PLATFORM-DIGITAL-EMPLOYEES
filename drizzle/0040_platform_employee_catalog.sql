CREATE TABLE IF NOT EXISTS "platform_employee_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "employee_id" uuid NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "platform_employee_catalog"
    ADD CONSTRAINT "platform_employee_catalog_employee_id_digital_employee_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_employee_catalog_employee_uidx"
  ON "platform_employee_catalog" USING btree ("employee_id");
