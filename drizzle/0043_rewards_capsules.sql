-- Rewards / Capsules domain: platform catalog + org ownership + daily claim.

CREATE TYPE "public"."reward_rarity" AS ENUM('core', 'professional', 'premium', 'executive', 'founders');
--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('skill_chip', 'appearance', 'voice', 'idle', 'background', 'frame');
--> statement-breakpoint
CREATE TYPE "public"."capsule_price_key" AS ENUM('free', '99', '4999');
--> statement-breakpoint
CREATE TYPE "public"."capsule_tier_id" AS ENUM('daily', 'standard', 'executive');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reward_definition" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "type" "reward_type" NOT NULL,
  "rarity" "reward_rarity" NOT NULL,
  "description" text NOT NULL,
  "compatible" text DEFAULT 'All Employees' NOT NULL,
  "boost_label" text,
  "featured" boolean DEFAULT false NOT NULL,
  "coming_soon" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reward_definition_slug_uidx"
  ON "reward_definition" USING btree ("slug");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capsule_tier" (
  "id" "capsule_tier_id" PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "price_key" "capsule_price_key" NOT NULL,
  "price_label" text NOT NULL,
  "blurb" text NOT NULL,
  "activate_label" text DEFAULT 'Activate' NOT NULL,
  "reward_preview_slugs" text[] DEFAULT '{}' NOT NULL,
  "is_store" boolean DEFAULT false NOT NULL,
  "is_daily" boolean DEFAULT false NOT NULL,
  "is_featured" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_reward_item" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "reward_slug" text NOT NULL,
  "owned_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "organization_reward_item"
    ADD CONSTRAINT "organization_reward_item_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_reward_item_org_slug_uidx"
  ON "organization_reward_item" USING btree ("organization_id", "reward_slug");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_capsule_holding" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "tier_id" "capsule_tier_id" NOT NULL,
  "owned_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "organization_capsule_holding"
    ADD CONSTRAINT "organization_capsule_holding_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_capsule_holding_org_tier_uidx"
  ON "organization_capsule_holding" USING btree ("organization_id", "tier_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_daily_capsule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "last_claimed_at" timestamp with time zone,
  "next_available_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "organization_daily_capsule"
    ADD CONSTRAINT "organization_daily_capsule_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_daily_capsule_org_uidx"
  ON "organization_daily_capsule" USING btree ("organization_id");
--> statement-breakpoint
ALTER TABLE organization_reward_item ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_reward_item FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS organization_reward_item_tenant ON organization_reward_item;
--> statement-breakpoint
CREATE POLICY organization_reward_item_tenant ON organization_reward_item
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE organization_capsule_holding ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_capsule_holding FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS organization_capsule_holding_tenant ON organization_capsule_holding;
--> statement-breakpoint
CREATE POLICY organization_capsule_holding_tenant ON organization_capsule_holding
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
--> statement-breakpoint
ALTER TABLE organization_daily_capsule ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_daily_capsule FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS organization_daily_capsule_tenant ON organization_daily_capsule;
--> statement-breakpoint
CREATE POLICY organization_daily_capsule_tenant ON organization_daily_capsule
  FOR ALL
  USING (app_rls_bypass() OR organization_id::text = app_current_org_id())
  WITH CHECK (app_rls_bypass() OR organization_id::text = app_current_org_id());
