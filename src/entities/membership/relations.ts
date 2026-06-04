import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { membership } from "./schema";

export const membershipRelations = relations(membership, ({ one }) => ({
  user: one(user, {
    fields: [membership.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [membership.organizationId],
    references: [organization.id],
  }),
}));
