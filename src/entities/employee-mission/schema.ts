import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import type {
  MissionEvidenceItem,
  MissionHandoffItem,
  MissionLeadItem,
  MissionTimelineStep,
} from "./types";

export const employeeMissionStatusEnum = pgEnum("employee_mission_status", [
  "planned",
  "working",
  "waiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

export const employeeMissionTypeEnum = pgEnum("employee_mission_type", [
  "prospecting",
  "custom",
]);

export const employeeMissionSourceEnum = pgEnum("employee_mission_source", [
  "manual",
  "scheduled",
]);

export const employeeMission = pgTable("employee_mission", {
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
  title: text("title").notNull(),
  goal: text("goal"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  skillIds: uuid("skill_ids").array().notNull().default([]),
  brief: text("brief").notNull(),
  type: employeeMissionTypeEnum("type").notNull().default("custom"),
  source: employeeMissionSourceEnum("source").notNull().default("manual"),
  scheduleId: uuid("schedule_id"),
  status: employeeMissionStatusEnum("status").notNull().default("planned"),
  plan: text("plan"),
  evidence: jsonb("evidence").$type<MissionEvidenceItem[]>().notNull().default([]),
  leads: jsonb("leads").$type<MissionLeadItem[]>().notNull().default([]),
  handoffs: jsonb("handoffs").$type<MissionHandoffItem[]>().notNull().default([]),
  timeline: jsonb("timeline").$type<MissionTimelineStep[]>().notNull().default([]),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
