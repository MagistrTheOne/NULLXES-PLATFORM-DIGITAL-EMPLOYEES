import type { CapsuleTierId } from "@/features/rewards/lib/catalog";

export type CapsuleAssetId = "base" | "diamond" | "gold";

export type CapsuleAsset = {
  id: CapsuleAssetId;
  label: string;
  /** Product tier label for UI */
  tierLabel: string;
  glb: string;
  preview: string;
};

/**
 * NULLXES capsule product assets (Activate / store).
 * Paths are case-sensitive on Linux (Vercel).
 */
export const CAPSULE_ASSETS: Record<CapsuleAssetId, CapsuleAsset> = {
  base: {
    id: "base",
    label: "Base",
    tierLabel: "Base",
    glb: "/capsule/Base.glb",
    preview: "/capsule/Base.png",
  },
  diamond: {
    id: "diamond",
    label: "Diamond",
    tierLabel: "Diamond",
    glb: "/capsule/Diamond.glb",
    preview: "/capsule/Diamond.png",
  },
  gold: {
    id: "gold",
    label: "Gold",
    tierLabel: "Legendary",
    glb: "/capsule/GOLD.glb",
    preview: "/capsule/Gold.png",
  },
};

export const CAPSULE_TIER_ASSET: Record<CapsuleTierId, CapsuleAssetId> = {
  daily: "base",
  standard: "diamond",
  executive: "gold",
};

export function getCapsuleAsset(tier: CapsuleTierId): CapsuleAsset {
  return CAPSULE_ASSETS[CAPSULE_TIER_ASSET[tier]];
}
