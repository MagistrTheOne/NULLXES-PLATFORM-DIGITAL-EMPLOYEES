import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { user } from "@/entities/user/schema";

export const employeeSessionStatusEnum = pgEnum("employee_session_status", [
  "created",
  "active",
  "completed",
  "failed",
  "expired",
]);

export const employeeSession = pgTable("employee_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: employeeSessionStatusEnum("status").notNull().default("created"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  messageCount: integer("message_count").notNull().default(0),
  satisfactionRating: numeric("satisfaction_rating", { precision: 2, scale: 1 }),
  firstResponseMs: integer("first_response_ms"),
  resolved: boolean("resolved").notNull().default(false),
  escalated: boolean("escalated").notNull().default(false),
  primaryTopic: text("primary_topic"),
  summary: text("summary"),
  summaryKnowledgeSourceId: uuid("summary_knowledge_source_id").references(
    () => knowledgeSource.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
