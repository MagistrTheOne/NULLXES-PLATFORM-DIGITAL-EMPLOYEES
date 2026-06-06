import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { employeeTask } from "./schema";

export const employeeTaskRelations = relations(employeeTask, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeTask.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [employeeTask.employeeId],
    references: [digitalEmployee.id],
  }),
  session: one(employeeSession, {
    fields: [employeeTask.sessionId],
    references: [employeeSession.id],
  }),
}));
