import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import {
  organizationCapsuleHolding,
  organizationDailyCapsule,
  organizationRewardItem,
} from "./schema";

export const organizationRewardItemRelations = relations(
  organizationRewardItem,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationRewardItem.organizationId],
      references: [organization.id],
    }),
  }),
);

export const organizationCapsuleHoldingRelations = relations(
  organizationCapsuleHolding,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationCapsuleHolding.organizationId],
      references: [organization.id],
    }),
  }),
);

export const organizationDailyCapsuleRelations = relations(
  organizationDailyCapsule,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationDailyCapsule.organizationId],
      references: [organization.id],
    }),
  }),
);
