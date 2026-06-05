import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { apiKey } from "./schema";

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  organization: one(organization, {
    fields: [apiKey.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [apiKey.createdByUserId],
    references: [user.id],
  }),
}));
