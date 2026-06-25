import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { hqTask } from "./schema";

export const hqTaskRelations = relations(hqTask, ({ one }) => ({
  organization: one(organization, {
    fields: [hqTask.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [hqTask.employeeId],
    references: [digitalEmployee.id],
  }),
}));
