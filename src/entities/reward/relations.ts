import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import {
  capsuleOpenEvent,
  employeeRewardLoadout,
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

export const employeeRewardLoadoutRelations = relations(
  employeeRewardLoadout,
  ({ one }) => ({
    organization: one(organization, {
      fields: [employeeRewardLoadout.organizationId],
      references: [organization.id],
    }),
    employee: one(digitalEmployee, {
      fields: [employeeRewardLoadout.employeeId],
      references: [digitalEmployee.id],
    }),
  }),
);

export const capsuleOpenEventRelations = relations(
  capsuleOpenEvent,
  ({ one }) => ({
    organization: one(organization, {
      fields: [capsuleOpenEvent.organizationId],
      references: [organization.id],
    }),
  }),
);
