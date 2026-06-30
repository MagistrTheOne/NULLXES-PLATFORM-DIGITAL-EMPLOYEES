import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { userConsent } from "./schema";

export const userConsentRelations = relations(userConsent, ({ one }) => ({
  user: one(user, {
    fields: [userConsent.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [userConsent.organizationId],
    references: [organization.id],
  }),
}));
