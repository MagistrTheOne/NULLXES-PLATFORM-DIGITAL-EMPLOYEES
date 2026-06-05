ALTER TABLE "organization_settings" ADD COLUMN "outbound_webhook_url" text;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD COLUMN "outbound_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "stripe_customer_id";