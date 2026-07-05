import { sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";

export const toolDefinitionTypeEnum = pgEnum("tool_definition_type", ["builtin"]);

export const toolRiskLevelEnum = pgEnum("tool_risk_level", [
  "read",
  "write",
  "destructive",
]);

export const toolDefinition = pgTable(
  "tool_definition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    parametersSchema: jsonb("parameters_schema").notNull(),
    type: toolDefinitionTypeEnum("type").notNull().default("builtin"),
    riskLevel: toolRiskLevelEnum("risk_level").notNull().default("read"),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    isSystemTemplate: boolean("is_system_template").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("tool_definition_system_slug_idx")
      .on(table.slug)
      .where(sql`${table.organizationId} IS NULL`),
    uniqueIndex("tool_definition_org_slug_idx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.organizationId} IS NOT NULL`),
  ],
);
