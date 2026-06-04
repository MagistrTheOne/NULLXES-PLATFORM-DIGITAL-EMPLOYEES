import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeRuntime } from "./schema";

export const employeeRuntimeRelations = relations(employeeRuntime, ({ one }) => ({
  employee: one(digitalEmployee, {
    fields: [employeeRuntime.employeeId],
    references: [digitalEmployee.id],
  }),
}));
