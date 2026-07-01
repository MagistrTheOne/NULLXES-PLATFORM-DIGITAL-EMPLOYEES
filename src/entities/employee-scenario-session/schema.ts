import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import type { ScenarioDebrief, ScenarioSessionMetrics } from "./types";

export const employeeScenarioSessionStatusEnum = pgEnum(
  "employee_scenario_session_status",
  ["pending", "in_talk", "debrief_ready", "completed", "abandoned"],
);

export const employeeScenarioSession = pgTable("employee_scenario_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  templateId: text("template_id").notNull(),
  status: employeeScenarioSessionStatusEnum("status")
    .notNull()
    .default("pending"),
  talkSessionId: uuid("talk_session_id").references(() => employeeSession.id, {
    onDelete: "set null",
  }),
  debrief: jsonb("debrief").$type<ScenarioDebrief>(),
  metrics: jsonb("metrics")
    .$type<ScenarioSessionMetrics>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
