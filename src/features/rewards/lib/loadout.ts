import {
  getRewardById,
  MOCK_EMPLOYEE_TARGETS,
  type RewardItem,
  type RewardType,
} from "./catalog";

export const SKILL_SLOT_COUNT = 3;

export type EmployeeLoadout = {
  appearanceId: string | null;
  voiceId: string | null;
  skillChipIds: Array<string | null>;
  backgroundId: string | null;
  idleId: string | null;
  frameId: string | null;
};

export type RecentEquipEvent = {
  itemId: string;
  employeeId: string;
  employeeName: string;
  at: number;
};

export type LoadoutStoreSnapshot = {
  loadouts: Record<string, EmployeeLoadout>;
  favorites: Record<string, boolean>;
  recent: RecentEquipEvent[];
};

export function emptyLoadout(): EmployeeLoadout {
  return {
    appearanceId: null,
    voiceId: null,
    skillChipIds: Array.from({ length: SKILL_SLOT_COUNT }, () => null),
    backgroundId: null,
    idleId: null,
    frameId: null,
  };
}

export function cloneLoadout(loadout: EmployeeLoadout): EmployeeLoadout {
  return {
    ...loadout,
    skillChipIds: [...loadout.skillChipIds],
  };
}

export function getOrCreateLoadout(
  map: Record<string, EmployeeLoadout>,
  employeeId: string,
): EmployeeLoadout {
  return map[employeeId] ? cloneLoadout(map[employeeId]) : emptyLoadout();
}

export function slotLabelForType(type: RewardType): string {
  switch (type) {
    case "appearance":
      return "Appearance";
    case "voice":
      return "Voice";
    case "skill_chip":
      return "Skill Chip";
    case "background":
      return "Background";
    case "idle":
      return "Idle";
    case "frame":
      return "Frame";
    default:
      return type;
  }
}

export function isItemEquippedOnLoadout(
  loadout: EmployeeLoadout,
  itemId: string,
): boolean {
  if (loadout.appearanceId === itemId) return true;
  if (loadout.voiceId === itemId) return true;
  if (loadout.backgroundId === itemId) return true;
  if (loadout.idleId === itemId) return true;
  if (loadout.frameId === itemId) return true;
  return loadout.skillChipIds.includes(itemId);
}

export function isItemEquippedAnywhere(
  loadouts: Record<string, EmployeeLoadout>,
  itemId: string,
): boolean {
  return Object.values(loadouts).some((loadout) =>
    isItemEquippedOnLoadout(loadout, itemId),
  );
}

export function equippedSkillCount(loadout: EmployeeLoadout): number {
  return loadout.skillChipIds.filter(Boolean).length;
}

/**
 * Apply an inventory item onto a loadout (replace semantics).
 * Skill chips fill the first empty slot, else replace slot 0.
 */
export function applyItemToLoadout(
  loadout: EmployeeLoadout,
  item: RewardItem,
): EmployeeLoadout {
  const next = cloneLoadout(loadout);

  switch (item.type) {
    case "appearance":
      next.appearanceId = item.id;
      break;
    case "voice":
      next.voiceId = item.id;
      break;
    case "background":
      next.backgroundId = item.id;
      break;
    case "idle":
      next.idleId = item.id;
      break;
    case "frame":
      next.frameId = item.id;
      break;
    case "skill_chip": {
      if (next.skillChipIds.includes(item.id)) break;
      const emptyIndex = next.skillChipIds.findIndex((id) => id === null);
      if (emptyIndex >= 0) {
        next.skillChipIds[emptyIndex] = item.id;
      } else {
        next.skillChipIds[0] = item.id;
      }
      break;
    }
    default:
      break;
  }

  return next;
}

export function resolveSlotReward(
  itemId: string | null,
): RewardItem | null {
  if (!itemId) return null;
  return getRewardById(itemId) ?? null;
}

export function findEmployeeTarget(employeeId: string) {
  return MOCK_EMPLOYEE_TARGETS.find((e) => e.id === employeeId);
}

export function loadoutsEqual(a: EmployeeLoadout, b: EmployeeLoadout): boolean {
  return (
    a.appearanceId === b.appearanceId &&
    a.voiceId === b.voiceId &&
    a.backgroundId === b.backgroundId &&
    a.idleId === b.idleId &&
    a.frameId === b.frameId &&
    a.skillChipIds.length === b.skillChipIds.length &&
    a.skillChipIds.every((id, index) => id === b.skillChipIds[index])
  );
}

/** Seeded demo loadout for Adeline-style targets. */
export function seedDemoLoadouts(): Record<string, EmployeeLoadout> {
  return {
    adeline: {
      appearanceId: "exec-black",
      voiceId: "exec-voice",
      skillChipIds: ["neg-mastery", "sales-eff", null],
      backgroundId: "board-room",
      idleId: null,
      frameId: null,
    },
    somnia: {
      appearanceId: null,
      voiceId: "calm-voice",
      skillChipIds: ["support-spec", null, null],
      backgroundId: null,
      idleId: "classic-idle",
      frameId: "minimal-frame",
    },
    yuki: emptyLoadout(),
  };
}
