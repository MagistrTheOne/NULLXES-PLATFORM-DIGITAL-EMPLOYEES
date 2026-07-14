import type {
  CapsuleTierId,
  RewardRarity,
} from "@/features/rewards/lib/catalog";

export type CapsuleHistoryItem = {
  id: string;
  tierId: CapsuleTierId;
  rewardSlug: string;
  rewardName: string;
  rarity: RewardRarity;
  source: string;
  createdAt: string;
};
