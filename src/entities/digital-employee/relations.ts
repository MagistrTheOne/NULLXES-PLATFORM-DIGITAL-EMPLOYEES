import { relations } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { organization } from "@/entities/organization/schema";
import { digitalEmployee } from "./schema";

export const digitalEmployeeRelations = relations(
  digitalEmployee,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [digitalEmployee.organizationId],
      references: [organization.id],
    }),
    knowledgeSources: many(knowledgeSource),
  }),
);
