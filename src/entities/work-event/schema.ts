import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { employeeTask } from "@/entities/task/schema";

export const employeeWorkEventTypeEnum = pgEnum("employee_work_event_type", [
  "task_received",
  "task_completed",
  "followup_executed",
  "knowledge_updated",
  "session_summarized",
  "api_response_sent",
  "handoff_created",
  "approval_requested",
  "approval_resolved",
]);

export const employeeWorkEvent = pgTable("employee_work_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => employeeTask.id, {
    onDelete: "set null",
  }),
  sessionId: uuid("session_id").references(() => employeeSession.id, {
    onDelete: "set null",
  }),
  eventType: employeeWorkEventTypeEnum("event_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
