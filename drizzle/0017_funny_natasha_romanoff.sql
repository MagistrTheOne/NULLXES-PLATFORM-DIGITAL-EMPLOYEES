CREATE TYPE "public"."audit_action" AS ENUM('settings.updated', 'employee.created', 'employee.deleted', 'session.exported', 'api_key.created', 'api_key.revoked', 'retention.purged', 'data.exported', 'member.invited', 'member.removed', 'integration.connected', 'integration.disconnected', 'org.migration.started', 'org.migration.completed', 'org.data_deletion.requested');--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"action" "audit_action" NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;