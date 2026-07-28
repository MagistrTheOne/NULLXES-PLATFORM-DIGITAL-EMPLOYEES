import {
  getAnamApiKeyPool,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { getAnamApiBaseUrl } from "@/shared/config/provider-env";
import {
  listAnamEmptyPersonaSlots,
  listAnamSlotsWithPersonaCapacity,
} from "@/features/provider-provisioning/services/resolve-anam-persona-slot";

const DEFAULT_ONE_SHOT_CAP = 1;

type AnamAvatarRow = {
  id: string;
  displayName?: string;
  name?: string;
  imageUrl?: string;
  videoUrl?: string;
};

function getOneShotCapPerKey(): number {
  const raw = process.env.ANAM_ONE_SHOT_CAP_PER_KEY?.trim();
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : DEFAULT_ONE_SHOT_CAP;
}

function isOneShotAvatar(avatar: AnamAvatarRow): boolean {
  const haystack =
    `${avatar.displayName ?? ""} ${avatar.name ?? ""} ${avatar.imageUrl ?? ""} ${avatar.videoUrl ?? ""}`.toLowerCase();
  return (
    haystack.includes("one-shot") ||
    haystack.includes("one_shot") ||
    haystack.includes("oneshot")
  );
}

async function listAvatarsOnKey(apiKey: string): Promise<AnamAvatarRow[] | null> {
  try {
    const response = await fetch(`${getAnamApiBaseUrl()}/avatars?perPage=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: AnamAvatarRow[] };
    return payload.data ?? [];
  } catch {
    return null;
  }
}

/** Lab keys with room for another one-shot avatar (live Anam API check). */
export async function listAnamSlotsWithOneShotCapacity(): Promise<AnamApiKeySlot[]> {
  const pool = getAnamApiKeyPool();
  const cap = getOneShotCapPerKey();
  const free: AnamApiKeySlot[] = [];

  await Promise.all(
    pool.map(async (entry) => {
      const avatars = await listAvatarsOnKey(entry.key);
      if (avatars === null) {
        return;
      }
      const oneShotCount = avatars.filter(isOneShotAvatar).length;
      if (oneShotCount < cap) {
        free.push(entry.slot);
      }
    }),
  );

  // Keep pool order (KEY → KEY_20) for deterministic create routing.
  const freeSet = new Set(free);
  return pool.map((entry) => entry.slot).filter((slot) => freeSet.has(slot));
}

function uniqueSlots(slots: AnamApiKeySlot[]): AnamApiKeySlot[] {
  const seen = new Set<AnamApiKeySlot>();
  const ordered: AnamApiKeySlot[] = [];

  for (const slot of slots) {
    if (!seen.has(slot)) {
      seen.add(slot);
      ordered.push(slot);
    }
  }

  return ordered;
}

/**
 * Ordered lab keys to try for one-shot avatar upload.
 * Prefers: empty DB persona slots → one-shot-free slots → persona capacity.
 * Re-reads env pool on every call so newly added/rotated keys are picked up.
 */
export async function resolveAnamAvatarUploadSlots(input: {
  preferredSlot?: AnamApiKeySlot | null;
  excludeEmployeeId?: string;
}): Promise<AnamApiKeySlot[]> {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    return [];
  }

  const [oneShotFree, emptyPersona, personaCapacity] = await Promise.all([
    listAnamSlotsWithOneShotCapacity(),
    listAnamEmptyPersonaSlots({
      excludeEmployeeId: input.excludeEmployeeId,
    }),
    listAnamSlotsWithPersonaCapacity({
      excludeEmployeeId: input.excludeEmployeeId,
    }),
  ]);

  const oneShotSet = new Set(oneShotFree);
  const capacitySet = new Set(personaCapacity);

  const ordered: AnamApiKeySlot[] = [];

  if (
    input.preferredSlot &&
    (oneShotSet.has(input.preferredSlot) ||
      capacitySet.has(input.preferredSlot))
  ) {
    ordered.push(input.preferredSlot);
  }

  for (const slot of emptyPersona) {
    if (oneShotSet.has(slot) || capacitySet.has(slot)) {
      ordered.push(slot);
    }
  }

  for (const slot of oneShotFree) {
    ordered.push(slot);
  }

  for (const slot of personaCapacity) {
    ordered.push(slot);
  }

  // If live one-shot probe failed entirely, still try persona-capacity slots.
  if (ordered.length === 0) {
    return personaCapacity;
  }

  return uniqueSlots(ordered);
}

/**
 * Slots safe for a new employee create (under ANAM_MAX_PERSONAS_PER_KEY).
 * Pool order: empty / under-capacity keys detected at runtime — no fixed default.
 */
export async function listAnamSlotsFreeForCreate(): Promise<AnamApiKeySlot[]> {
  return listAnamSlotsWithPersonaCapacity();
}
