ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'security.2fa.enabled';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'security.2fa.disabled';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'security.2fa.failed_attempt';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'security.backup_codes.generated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'security.trusted_device.created';
