-- Employee reward loadout (equip persistence).

CREATE TABLE IF NOT EXISTS "employee_reward_loadout" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "appearance_slug" text,
  "voice_slug" text,
  "background_slug" text,
  "idle_slug" text,
  "frame_slug" text,
  "skill_chip_slugs" text[] DEFAULT '{}' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employee_reward_loadout"
    ADD CONSTRAINT "employee_reward_loadout_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employee_reward_loadout"
    ADD CONSTRAINT "employee_reward_loadout_employee_id_digital_employee_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "public"."digital_employee"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employee_reward_loadout_employee_uidx"
  ON "employee_reward_loadout" USING btree ("employee_id");
--> statement-breakpoint
ALTER TABLE employee_reward_loadout ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE employee_reward_loadout FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS employee_reward_loadout_tenant ON employee_reward_loadout;
--> statement-breakpoint
CREATE POLICY employee_reward_loadout_tenant ON employee_reward_loadout
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
