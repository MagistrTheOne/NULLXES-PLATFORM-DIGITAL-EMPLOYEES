import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { TalkSessionBrainCache } from "@/features/runtime-session/types/talk-turn-metrics";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const employeeSessionStatusEnum = pgEnum("employee_session_status", [
  "created",
  "active",
  "completed",
  "failed",
  "expired",
]);

export const employeeSession = pgTable(
  "employee_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    /** Caller workspace that started Talk (not always the employee home org). */
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
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
    satisfactionRating: numeric("satisfaction_rating", {
      precision: 2,
      scale: 1,
    }),
    firstResponseMs: integer("first_response_ms"),
    resolved: boolean("resolved").notNull().default(false),
    escalated: boolean("escalated").notNull().default(false),
    primaryTopic: text("primary_topic"),
    summary: text("summary"),
    summaryKnowledgeSourceId: uuid("summary_knowledge_source_id").references(
      () => knowledgeSource.id,
      { onDelete: "set null" },
    ),
    talkBrainCache: jsonb("talk_brain_cache").$type<
      TalkSessionBrainCache | null
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("employee_session_open_unique")
      .on(table.employeeId, table.userId)
      .where(sql`${table.status} in ('created', 'active')`),
  ],
);
