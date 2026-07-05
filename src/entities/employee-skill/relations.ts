import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { skill } from "@/entities/skill/schema";
import { employeeSkill } from "./schema";

export const employeeSkillRelations = relations(employeeSkill, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeSkill.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [employeeSkill.employeeId],
    references: [digitalEmployee.id],
  }),
  skill: one(skill, {
    fields: [employeeSkill.skillId],
    references: [skill.id],
  }),
}));
