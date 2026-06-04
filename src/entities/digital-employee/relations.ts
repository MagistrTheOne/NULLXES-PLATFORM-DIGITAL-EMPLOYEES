import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { digitalEmployee } from "./schema";

export const digitalEmployeeRelations = relations(digitalEmployee, ({ one }) => ({
  organization: one(organization, {
    fields: [digitalEmployee.organizationId],
    references: [organization.id],
  }),
}));
