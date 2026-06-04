import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { user } from "@/entities/user/schema";
import { employeeSession } from "./schema";

export const employeeSessionRelations = relations(employeeSession, ({ one }) => ({
  employee: one(digitalEmployee, {
    fields: [employeeSession.employeeId],
    references: [digitalEmployee.id],
  }),
  user: one(user, {
    fields: [employeeSession.userId],
    references: [user.id],
  }),
}));
