import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { organizationProviderCredential } from "./schema";

export const organizationProviderCredentialRelations = relations(
  organizationProviderCredential,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationProviderCredential.organizationId],
      references: [organization.id],
    }),
    createdBy: one(user, {
      fields: [organizationProviderCredential.createdByUserId],
      references: [user.id],
    }),
  }),
);
