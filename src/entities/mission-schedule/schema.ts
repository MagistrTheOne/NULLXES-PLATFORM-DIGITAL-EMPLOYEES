import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { employeeMissionTypeEnum } from "@/entities/employee-mission/schema";

export const missionSchedule = pgTable("mission_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: employeeMissionTypeEnum("type").notNull().default("prospecting"),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  cronExpression: text("cron_expression").notNull().default("0 6 * * *"),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  enabled: boolean("enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
