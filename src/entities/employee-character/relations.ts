import { relations } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeCharacter } from "./schema";

export const employeeCharacterRelations = relations(employeeCharacter, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeCharacter.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [employeeCharacter.employeeId],
    references: [digitalEmployee.id],
  }),
  preset: one(characterPreset, {
    fields: [employeeCharacter.presetId],
    references: [characterPreset.id],
  }),
}));
