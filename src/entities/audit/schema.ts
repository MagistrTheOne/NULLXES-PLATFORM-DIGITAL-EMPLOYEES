import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const auditActionEnum = pgEnum("audit_action", [
  "settings.updated",
  "employee.created",
  "employee.deleted",
  "session.exported",
  "api_key.created",
  "api_key.revoked",
  "api.access.denied",
  "api.task.enqueued",
  "retention.purged",
  "data.exported",
  "member.invited",
  "member.removed",
  "integration.connected",
  "integration.disconnected",
  "org.migration.started",
  "org.migration.completed",
  "org.data_deletion.requested",
  "security.2fa.enabled",
  "security.2fa.disabled",
  "security.2fa.failed_attempt",
  "security.backup_codes.generated",
  "security.trusted_device.created",
]);

export const auditEvent = pgTable("audit_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  actorRole: text("actor_role"),
  action: auditActionEnum("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuditAction = (typeof auditActionEnum.enumValues)[number];
