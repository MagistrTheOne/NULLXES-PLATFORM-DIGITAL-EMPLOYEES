import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { organizationInvite } from "./schema";

export const organizationInviteRelations = relations(
  organizationInvite,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationInvite.organizationId],
      references: [organization.id],
    }),
    invitedBy: one(user, {
      fields: [organizationInvite.invitedByUserId],
      references: [user.id],
    }),
  }),
);
