import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { skill } from "./schema";

export const skillRelations = relations(skill, ({ one }) => ({
  organization: one(organization, {
    fields: [skill.organizationId],
    references: [organization.id],
  }),
}));
