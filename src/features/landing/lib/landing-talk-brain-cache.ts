import "server-only";

import type { TalkSessionBrainCache } from "@/features/runtime-session/types/talk-turn-metrics";
import { buildTalkSessionBrainCache } from "@/features/runtime-session/services/build-talk-session-brain-cache";

const TTL_MS = 5 * 60 * 1000;

type Entry = {
  cache: TalkSessionBrainCache;
  expiresAt: number;
};

/**
 * Process-local cache for the public landing Talk brain.
 * Landing has no employeeSessionId, so without this every turn rebuilds
 * persona + blueprint from DB and adds multi-hundred-ms to "Thinking".
 */
const byEmployee = new Map<string, Entry>();

export async function loadLandingTalkBrainCache(input: {
  organizationId: string;
  employeeId: string;
}): Promise<{ cache: TalkSessionBrainCache | null; cacheHit: boolean }> {
  const existing = byEmployee.get(input.employeeId);
  if (existing && existing.expiresAt > Date.now()) {
    return { cache: existing.cache, cacheHit: true };
  }

  const cache = await buildTalkSessionBrainCache({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
  });

  if (cache) {
    byEmployee.set(input.employeeId, {
      cache,
      expiresAt: Date.now() + TTL_MS,
    });
  } else {
    byEmployee.delete(input.employeeId);
  }

  return { cache, cacheHit: false };
}
