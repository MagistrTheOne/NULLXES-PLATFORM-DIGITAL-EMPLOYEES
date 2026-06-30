import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { missionSchedule } from "@/entities/mission-schedule/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { employeeMission } from "./schema";

export const employeeMissionRelations = relations(employeeMission, ({ one }) => ({
  organization: one(organization, {
    fields: [employeeMission.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [employeeMission.employeeId],
    references: [digitalEmployee.id],
  }),
  schedule: one(missionSchedule, {
    fields: [employeeMission.scheduleId],
    references: [missionSchedule.id],
  }),
  createdBy: one(user, {
    fields: [employeeMission.createdByUserId],
    references: [user.id],
  }),
}));
