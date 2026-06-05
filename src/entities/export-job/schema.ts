import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const exportJobStatusEnum = pgEnum("export_job_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const exportJob = pgTable("export_job", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  requestedByUserId: text("requested_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: exportJobStatusEnum("status").notNull().default("pending"),
  format: text("format").notNull().default("json"),
  downloadToken: text("download_token"),
  downloadExpiresAt: timestamp("download_expires_at", { withTimezone: true }),
  payloadPath: text("payload_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
