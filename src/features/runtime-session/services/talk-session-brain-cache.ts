import "server-only";

import { eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import type { TalkSessionBrainCache } from "../types/talk-turn-metrics";
import { buildTalkSessionBrainCache } from "./build-talk-session-brain-cache";

export async function loadTalkSessionBrainCache(
  sessionId: string,
): Promise<TalkSessionBrainCache | null> {
  const [row] = await db
    .select({ talkBrainCache: employeeSession.talkBrainCache })
    .from(employeeSession)
    .where(eq(employeeSession.id, sessionId))
    .limit(1);

  const cache = row?.talkBrainCache ?? null;
  if (!cache || cache.v !== 1) {
    return null;
  }

  return cache;
}

export async function saveTalkSessionBrainCache(
  sessionId: string,
  cache: TalkSessionBrainCache,
): Promise<void> {
  await db
    .update(employeeSession)
    .set({ talkBrainCache: cache })
    .where(eq(employeeSession.id, sessionId));
}

export async function warmTalkSessionBrainCache(input: {
  sessionId: string;
  organizationId: string;
  employeeId: string;
}): Promise<TalkSessionBrainCache | null> {
  const existing = await loadTalkSessionBrainCache(input.sessionId);
  if (existing) {
    return existing;
  }

  const cache = await buildTalkSessionBrainCache({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
  });

  if (!cache) {
    return null;
  }

  await saveTalkSessionBrainCache(input.sessionId, cache);
  return cache;
}
