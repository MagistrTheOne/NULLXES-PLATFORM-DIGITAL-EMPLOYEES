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
import type { CharacterSpeechStyle, CharacterTraits } from "./types";

export const characterLanguagePolicyEnum = pgEnum("character_language_policy", [
  "ru",
  "en",
  "auto",
]);

export const characterPreset = pgTable(
  "character_preset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    traits: jsonb("traits").$type<CharacterTraits>().notNull(),
    speechStyle: jsonb("speech_style").$type<CharacterSpeechStyle>().notNull(),
    boundaries: text("boundaries"),
    languagePolicy: characterLanguagePolicyEnum("language_policy")
      .notNull()
      .default("ru"),
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
    uniqueIndex("character_preset_system_slug_idx")
      .on(table.slug)
      .where(sql`${table.organizationId} IS NULL`),
    uniqueIndex("character_preset_org_slug_idx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.organizationId} IS NOT NULL`),
  ],
);
