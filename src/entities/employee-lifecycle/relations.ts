import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { user } from "@/entities/user/schema";
import { employeeLifecycleEvent } from "./schema";

export const employeeLifecycleEventRelations = relations(
  employeeLifecycleEvent,
  ({ one }) => ({
    employee: one(digitalEmployee, {
      fields: [employeeLifecycleEvent.employeeId],
      references: [digitalEmployee.id],
    }),
    actor: one(user, {
      fields: [employeeLifecycleEvent.actorUserId],
      references: [user.id],
    }),
  }),
);
