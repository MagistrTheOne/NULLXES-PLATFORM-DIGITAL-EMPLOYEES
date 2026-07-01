import {
  getAnamApiKeyPool,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { getAnamApiBaseUrl } from "@/shared/config/provider-env";
import { listAnamSlotsWithPersonaCapacity } from "@/features/provider-provisioning/services/resolve-anam-persona-slot";

const DEFAULT_ONE_SHOT_CAP = 1;

type AnamAvatarRow = {
  id: string;
  displayName?: string;
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
  const haystack = `${avatar.imageUrl ?? ""} ${avatar.videoUrl ?? ""}`.toLowerCase();
  return haystack.includes("one-shot") || haystack.includes("one_shot");
}

async function listAvatarsOnKey(apiKey: string): Promise<AnamAvatarRow[]> {
  const response = await fetch(`${getAnamApiBaseUrl()}/avatars?perPage=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: AnamAvatarRow[] };
  return payload.data ?? [];
}

/** Lab keys with room for another one-shot avatar (live Anam API check). */
export async function listAnamSlotsWithOneShotCapacity(): Promise<AnamApiKeySlot[]> {
  const pool = getAnamApiKeyPool();
  const cap = getOneShotCapPerKey();
  const free: AnamApiKeySlot[] = [];

  for (const entry of pool) {
    try {
      const avatars = await listAvatarsOnKey(entry.key);
      const oneShotCount = avatars.filter(isOneShotAvatar).length;
      if (oneShotCount < cap) {
        free.push(entry.slot);
      }
    } catch {
      continue;
    }
  }

  return free;
}

export function getDefaultAnamAvatarSlot(): AnamApiKeySlot | null {
  const raw = process.env.ANAM_DEFAULT_AVATAR_SLOT?.trim();
  if (!raw) {
    return null;
  }

  const pool = getAnamApiKeyPool();
  if (!pool.some((entry) => entry.slot === raw)) {
    return null;
  }

  return raw as AnamApiKeySlot;
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

/** Ordered lab keys to try for one-shot avatar upload — skips full keys via live Anam API check. */
export async function resolveAnamAvatarUploadSlots(input: {
  preferredSlot?: AnamApiKeySlot | null;
  excludeEmployeeId?: string;
}): Promise<AnamApiKeySlot[]> {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    return [];
  }

  const oneShotFree = await listAnamSlotsWithOneShotCapacity();
  if (oneShotFree.length === 0) {
    return listAnamSlotsWithPersonaCapacity({
      excludeEmployeeId: input.excludeEmployeeId,
    });
  }

  const ordered: AnamApiKeySlot[] = [];

  if (input.preferredSlot && oneShotFree.includes(input.preferredSlot)) {
    ordered.push(input.preferredSlot);
  }

  const defaultSlot = getDefaultAnamAvatarSlot();
  if (defaultSlot && oneShotFree.includes(defaultSlot)) {
    ordered.push(defaultSlot);
  }

  for (const entry of pool) {
    if (oneShotFree.includes(entry.slot)) {
      ordered.push(entry.slot);
    }
  }

  return uniqueSlots(ordered);
}
