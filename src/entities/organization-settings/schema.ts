import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { brainProviderEnum } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";

export const organizationSettings = pgTable("organization_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  website: text("website"),
  industry: text("industry").notNull().default("enterprise"),
  timezone: text("timezone").notNull().default("UTC"),
  theme: text("theme").notNull().default("dark"),
  language: text("language").notNull().default("en"),
  dateFormat: text("date_format").notNull().default("MMM d, yyyy"),
  timeFormat: text("time_format").notNull().default("24h"),
  defaultTimeRangeDays: integer("default_time_range_days").notNull().default(7),
  compactMode: boolean("compact_mode").notNull().default(false),
  defaultBrainProvider: brainProviderEnum("default_brain_provider")
    .notNull()
    .default("openai"),
  defaultBrainModel: text("default_brain_model")
    .notNull()
    .default("gpt-4.1-mini"),
  knowledgeProcessing: text("knowledge_processing").notNull().default("auto"),
  sessionRetentionDays: integer("session_retention_days").notNull().default(90),
  retentionPolicyDays: integer("retention_policy_days").notNull().default(90),
  notifySessionCompleted: boolean("notify_session_completed").notNull().default(true),
  notifyEmployeeCreated: boolean("notify_employee_created").notNull().default(true),
  notifyKnowledgeFailed: boolean("notify_knowledge_failed").notNull().default(true),
  notifyWeeklyDigest: boolean("notify_weekly_digest").notNull().default(false),
  outboundWebhookUrl: text("outbound_webhook_url"),
  outboundWebhookSecret: text("outbound_webhook_secret"),
  requireTwoFactorForAdmins: boolean("require_two_factor_for_admins")
    .notNull()
    .default(false),
  apiIpAllowlist: text("api_ip_allowlist"),
  lastRetentionRunAt: timestamp("last_retention_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
