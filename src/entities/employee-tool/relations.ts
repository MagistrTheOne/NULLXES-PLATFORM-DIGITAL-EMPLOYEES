import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";
import { employeeTool } from "./schema";

export const employeeToolRelations = relations(employeeTool, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeTool.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [employeeTool.employeeId],
    references: [digitalEmployee.id],
  }),
  toolDefinition: one(toolDefinition, {
    fields: [employeeTool.toolDefinitionId],
    references: [toolDefinition.id],
  }),
}));
