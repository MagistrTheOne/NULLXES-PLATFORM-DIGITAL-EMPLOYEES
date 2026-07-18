/**
 * Capsule cosmetics under public/Capsules (case-sensitive on Vercel).
 */
import type { RewardRarity } from "@/features/rewards/lib/catalog";

/** Clean board-room plate (reward background). */
export const COSMETIC_BACKGROUND_BOARD_ROOM =
  "/Capsules/ROOM/board-room.png";

/** Softer unlock / office plate. */
export const COSMETIC_BACKGROUND_OFFICE_SOFT =
  "/Capsules/Background/unlockeed.png";

/** Legacy fallback. */
export const COSMETIC_BACKGROUND_DEFAULT =
  "/Capsules/Background/Background.png";

export const COSMETIC_EQUIP_BADGE = "/Capsules/Badge/badge.png";

export const COSMETIC_FRAME = {
  "minimal-frame": "/Capsules/frame/base.png",
  "thin-line": "/Capsules/frame/gold.png",
  "legendary-frame": "/Capsules/frame/legendary.png",
} as const;

/** Atmosphere plates by rarity (Collection / card chrome). */
export const COSMETIC_RARITY_ROOM: Record<RewardRarity, string> = {
  core: "/Capsules/ROOM/Core.png",
  professional: "/Capsules/ROOM/Premium.png",
  premium: "/Capsules/ROOM/Premium.png",
  executive: "/Capsules/ROOM/Executive.png",
  founders: "/Capsules/ROOM/Founder.jpg",
};

export const COSMETIC_ROOM_LEGENDARY = "/Capsules/ROOM/Legendary.png";

const BACKGROUND_BY_SLUG: Record<string, string> = {
  "board-room": COSMETIC_BACKGROUND_BOARD_ROOM,
  "office-soft": COSMETIC_BACKGROUND_OFFICE_SOFT,
};

/** Map reward slug → plate art for equipped background slot. */
export function resolveCosmeticBackgroundSrc(
  backgroundId: string | null | undefined,
): string | null {
  if (!backgroundId) return null;
  return BACKGROUND_BY_SLUG[backgroundId] ?? COSMETIC_BACKGROUND_DEFAULT;
}

/** Map equipped / catalog frame slug → overlay PNG (transparent center). */
export function resolveCosmeticFrameSrc(
  frameId: string | null | undefined,
): string | null {
  if (!frameId) return null;
  return COSMETIC_FRAME[frameId as keyof typeof COSMETIC_FRAME] ?? null;
}

/** Rarity atmosphere for Collection cards (not equipped loadout). */
export function resolveRarityRoomSrc(rarity: RewardRarity): string {
  return COSMETIC_RARITY_ROOM[rarity] ?? COSMETIC_RARITY_ROOM.core;
}

/**
 * Best preview art for a catalog item (Collection / Inventory grid).
 * Backgrounds → room plate; frames → frame PNG; else rarity atmosphere.
 */
export function resolveRewardPreviewSrc(input: {
  id: string;
  type: string;
  rarity: RewardRarity;
}): string | null {
  if (input.type === "background") {
    return resolveCosmeticBackgroundSrc(input.id);
  }
  if (input.type === "frame") {
    return resolveCosmeticFrameSrc(input.id);
  }
  if (input.rarity === "founders") {
    return COSMETIC_ROOM_LEGENDARY;
  }
  return resolveRarityRoomSrc(input.rarity);
}

export function hasAnyLoadoutEquipped(loadout: {
  appearanceId: string | null;
  voiceId: string | null;
  backgroundId: string | null;
  frameId: string | null;
  skillChipIds: Array<string | null>;
}): boolean {
  return Boolean(loadout.voiceId || loadout.backgroundId || loadout.frameId);
}
