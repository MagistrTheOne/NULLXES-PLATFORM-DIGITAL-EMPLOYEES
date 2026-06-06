import { jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeTask } from "@/entities/task/schema";

export const employeeHandoffStatusEnum = pgEnum("employee_handoff_status", [
  "pending",
  "accepted",
  "completed",
  "cancelled",
]);

export const employeeHandoff = pgTable("employee_handoff", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromEmployeeId: uuid("from_employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  toEmployeeId: uuid("to_employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => employeeTask.id, {
    onDelete: "set null",
  }),
  context: jsonb("context").$type<Record<string, unknown>>().notNull(),
  status: employeeHandoffStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
