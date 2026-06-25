import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";

export const hqTaskStatusEnum = pgEnum("hq_task_status", [
  "pending",
  "running",
  "done",
  "cancelled",
]);

/** Floor destinations mirror the HQ department rooms. */
export const hqTaskDestinationEnum = pgEnum("hq_task_destination", [
  "reception",
  "sales",
  "support",
  "hr",
  "analytics",
  "executive",
]);

/**
 * A floor errand for a digital employee: "go to CRM", "head to Analytics".
 * Issued from the agent chat (parsed command) and lives just long enough for
 * the employee to physically walk to the destination on the HQ floor. Lazily
 * completed when `expiresAt` passes.
 */
export const hqTask = pgTable("hq_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  destination: hqTaskDestinationEnum("destination").notNull(),
  label: text("label").notNull(),
  status: hqTaskStatusEnum("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
