import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "./schema";

export const employeeProviderConfigRelations = relations(
  employeeProviderConfig,
  ({ one }) => ({
    employee: one(digitalEmployee, {
      fields: [employeeProviderConfig.employeeId],
      references: [digitalEmployee.id],
    }),
  }),
);
