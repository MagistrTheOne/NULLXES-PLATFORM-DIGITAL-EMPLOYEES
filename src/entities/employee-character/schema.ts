import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { characterPreset } from "@/entities/character-preset/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import type { EmployeeCharacterTraitOverrides } from "./types";

export const employeeCharacter = pgTable(
  "employee_character",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    presetId: uuid("preset_id").references(() => characterPreset.id, {
      onDelete: "set null",
    }),
    traitOverrides: jsonb("trait_overrides")
      .$type<EmployeeCharacterTraitOverrides>()
      .notNull()
      .default({}),
    customPromptBlock: text("custom_prompt_block"),
    compiledPromptBlock: text("compiled_prompt_block").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("employee_character_employee_id_unique").on(table.employeeId)],
);
