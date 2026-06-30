import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { missionSchedule } from "./schema";

export const missionScheduleRelations = relations(missionSchedule, ({ one }) => ({
  organization: one(organization, {
    fields: [missionSchedule.organizationId],
    references: [organization.id],
  }),
  employee: one(digitalEmployee, {
    fields: [missionSchedule.employeeId],
    references: [digitalEmployee.id],
  }),
  createdBy: one(user, {
    fields: [missionSchedule.createdByUserId],
    references: [user.id],
  }),
}));
