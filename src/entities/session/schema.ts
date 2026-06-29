import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
}, (table) => [
  // At most one open (created/active) session per employee+user. This is the
  // DB-level guard that makes session reuse atomic under concurrency: the
  // neon-http driver has no interactive transactions, so the reuse check is a
  // check-then-act race. The partial unique index lets the INSERT use
  // ON CONFLICT DO NOTHING and lose gracefully to a concurrent winner.
  uniqueIndex("employee_session_open_unique")
    .on(table.employeeId, table.userId)
    .where(sql`${table.status} in ('created', 'active')`),
]);
