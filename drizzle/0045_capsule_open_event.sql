-- Capsule open / drop history.

CREATE TYPE "public"."capsule_open_source" AS ENUM('daily', 'purchase', 'holding');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capsule_open_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "tier_id" "capsule_tier_id" NOT NULL,
  "source" "capsule_open_source" NOT NULL,
  "reward_slug" text NOT NULL,
  "payment_order_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "capsule_open_event"
    ADD CONSTRAINT "capsule_open_event_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE capsule_open_event ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE capsule_open_event FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS capsule_open_event_tenant ON capsule_open_event;
--> statement-breakpoint
CREATE POLICY capsule_open_event_tenant ON capsule_open_event
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
