-- Migrate billing plan enum: super_pro → scale; add studio/operator/scale.
ALTER TYPE "organization_billing_plan" ADD VALUE IF NOT EXISTS 'studio';
--> statement-breakpoint
ALTER TYPE "organization_billing_plan" ADD VALUE IF NOT EXISTS 'operator';
--> statement-breakpoint
ALTER TYPE "organization_billing_plan" ADD VALUE IF NOT EXISTS 'scale';
--> statement-breakpoint
UPDATE "organization" SET "billing_plan" = 'scale' WHERE "billing_plan" = 'super_pro';
