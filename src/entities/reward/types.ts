import type {
  capsuleTier,
  organizationCapsuleHolding,
  organizationDailyCapsule,
  organizationRewardItem,
  rewardDefinition,
} from "./schema";

export type RewardDefinitionRow = typeof rewardDefinition.$inferSelect;
export type NewRewardDefinitionRow = typeof rewardDefinition.$inferInsert;

export type CapsuleTierRow = typeof capsuleTier.$inferSelect;
export type NewCapsuleTierRow = typeof capsuleTier.$inferInsert;

export type OrganizationRewardItemRow =
  typeof organizationRewardItem.$inferSelect;
export type OrganizationCapsuleHoldingRow =
  typeof organizationCapsuleHolding.$inferSelect;
export type OrganizationDailyCapsuleRow =
  typeof organizationDailyCapsule.$inferSelect;
