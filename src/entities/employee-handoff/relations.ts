import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeTask } from "@/entities/task/schema";
import { employeeHandoff } from "./schema";

export const employeeHandoffRelations = relations(
  employeeHandoff,
  ({ one }) => ({
    fromEmployee: one(digitalEmployee, {
      fields: [employeeHandoff.fromEmployeeId],
      references: [digitalEmployee.id],
      relationName: "handoffFrom",
    }),
    toEmployee: one(digitalEmployee, {
      fields: [employeeHandoff.toEmployeeId],
      references: [digitalEmployee.id],
      relationName: "handoffTo",
    }),
    task: one(employeeTask, {
      fields: [employeeHandoff.taskId],
      references: [employeeTask.id],
    }),
  }),
);
