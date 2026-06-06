import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeTask } from "@/entities/task/schema";
import { user } from "@/entities/user/schema";

export const agentApprovalStatusEnum = pgEnum("agent_approval_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const agentApprovalRequest = pgTable("agent_approval_request", {
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
  actionType: text("action_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: agentApprovalStatusEnum("status").notNull().default("pending"),
  reviewerUserId: text("reviewer_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
