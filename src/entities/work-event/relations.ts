import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { employeeTask } from "@/entities/task/schema";
import { employeeWorkEvent } from "./schema";

export const employeeWorkEventRelations = relations(
  employeeWorkEvent,
  ({ one }) => ({
    organization: one(organization, {
      fields: [employeeWorkEvent.organizationId],
      references: [organization.id],
    }),
    employee: one(digitalEmployee, {
      fields: [employeeWorkEvent.employeeId],
      references: [digitalEmployee.id],
    }),
    task: one(employeeTask, {
      fields: [employeeWorkEvent.taskId],
      references: [employeeTask.id],
    }),
    session: one(employeeSession, {
      fields: [employeeWorkEvent.sessionId],
      references: [employeeSession.id],
    }),
  }),
);
