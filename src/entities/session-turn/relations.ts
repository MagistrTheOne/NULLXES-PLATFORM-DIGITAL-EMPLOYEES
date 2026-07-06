import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { employeeSessionTurn } from "./schema";

export const employeeSessionTurnRelations = relations(
  employeeSessionTurn,
  ({ one }) => ({
    session: one(employeeSession, {
      fields: [employeeSessionTurn.sessionId],
      references: [employeeSession.id],
    }),
    employee: one(digitalEmployee, {
      fields: [employeeSessionTurn.employeeId],
      references: [digitalEmployee.id],
    }),
  }),
);
