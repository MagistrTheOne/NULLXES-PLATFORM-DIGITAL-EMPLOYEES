import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";

export const employeeTaskStatusEnum = pgEnum("employee_task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const employeeTaskSourceEnum = pgEnum("employee_task_source", [
  "talk_tool",
  "api",
  "followup",
  "handoff",
  "session_summary",
]);

export const employeeTask = pgTable("employee_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => employeeSession.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: employeeTaskStatusEnum("status").notNull().default("pending"),
  source: employeeTaskSourceEnum("source").notNull().default("api"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  result: text("result"),
  callbackUrl: text("callback_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
