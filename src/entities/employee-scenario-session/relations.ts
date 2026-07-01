import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { employeeScenarioSession } from "./schema";

export const employeeScenarioSessionRelations = relations(
  employeeScenarioSession,
  ({ one }) => ({
    organization: one(organization, {
      fields: [employeeScenarioSession.organizationId],
      references: [organization.id],
    }),
    employee: one(digitalEmployee, {
      fields: [employeeScenarioSession.employeeId],
      references: [digitalEmployee.id],
    }),
    user: one(user, {
      fields: [employeeScenarioSession.userId],
      references: [user.id],
    }),
    talkSession: one(employeeSession, {
      fields: [employeeScenarioSession.talkSessionId],
      references: [employeeSession.id],
    }),
  }),
);
