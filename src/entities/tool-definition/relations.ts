import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { toolDefinition } from "./schema";

export const toolDefinitionRelations = relations(toolDefinition, ({ one }) => ({
  organization: one(organization, {
    fields: [toolDefinition.organizationId],
    references: [organization.id],
  }),
}));
