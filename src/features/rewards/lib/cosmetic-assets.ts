/**
 * Capsule cosmetics under public/Capsules (case-sensitive on Vercel).
 */

export const COSMETIC_BACKGROUND_DEFAULT =
  "/Capsules/Background/Background.png";

export const COSMETIC_BACKGROUND_SOFT =
  "/Capsules/Background/unlockeed.png";

export const COSMETIC_EQUIP_BADGE = "/Capsules/Badge/badge.png";

/** Map reward slug → plate art for equipped background slot. */
export function resolveCosmeticBackgroundSrc(
  backgroundId: string | null | undefined,
): string | null {
  if (!backgroundId) {
    return null;
  }

  if (backgroundId === "office-soft") {
    return COSMETIC_BACKGROUND_SOFT;
  }

  // board-room and any other background slug share the primary plate for now.
  return COSMETIC_BACKGROUND_DEFAULT;
}

export function hasAnyLoadoutEquipped(loadout: {
  appearanceId: string | null;
  voiceId: string | null;
  backgroundId: string | null;
  frameId: string | null;
  skillChipIds: Array<string | null>;
}): boolean {
  return Boolean(
    loadout.appearanceId ||
      loadout.voiceId ||
      loadout.backgroundId ||
      loadout.frameId ||
      loadout.skillChipIds.some(Boolean),
  );
}
