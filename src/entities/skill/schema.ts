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
import type { SkillCategory, SkillTriggers } from "./types";

export const skillCategoryEnum = pgEnum("skill_category", [
  "sales",
  "support",
  "legal",
  "ops",
  "custom",
]);

export const skillProficiencyEnum = pgEnum("skill_proficiency", [
  "basic",
  "standard",
  "expert",
]);

export const skill = pgTable(
  "skill",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    instructions: text("instructions").notNull(),
    triggers: jsonb("triggers").$type<SkillTriggers>().notNull().default({
      keywords: [],
      intents: [],
    }),
    requiredToolSlugs: text("required_tool_slugs").array().notNull().default([]),
    category: skillCategoryEnum("category").notNull().default("custom"),
    promptBlock: text("prompt_block").notNull(),
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
    uniqueIndex("skill_system_slug_idx")
      .on(table.slug)
      .where(sql`${table.organizationId} IS NULL`),
    uniqueIndex("skill_org_slug_idx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.organizationId} IS NOT NULL`),
  ],
);
