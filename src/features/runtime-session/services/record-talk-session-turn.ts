import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { employeeSessionTurn } from "@/entities/session-turn/schema";
import { db } from "@/shared/db/client";
import type {
  TalkSessionMetricsSnapshot,
  TalkTurnFlags,
  TalkTurnSpans,
} from "../types/talk-turn-metrics";

export type { TalkSessionMetricsSnapshot } from "../types/talk-turn-metrics";

export async function recordTalkSessionTurn(input: {
  sessionId: string;
  employeeId: string;
  turnId: string;
  voiceMode?: string;
  spans: TalkTurnSpans;
  flags?: TalkTurnFlags;
}): Promise<void> {
  const e2eMs = input.spans.e2e ?? null;

  await db
    .insert(employeeSessionTurn)
    .values({
      sessionId: input.sessionId,
      employeeId: input.employeeId,
      turnId: input.turnId,
      voiceMode: input.voiceMode ?? null,
      spans: input.spans,
      flags: input.flags ?? {},
      e2eMs,
    })
    .onConflictDoUpdate({
      target: employeeSessionTurn.turnId,
      set: {
        spans: input.spans,
        flags: input.flags ?? {},
        e2eMs,
        voiceMode: input.voiceMode ?? null,
      },
    });

  if (e2eMs !== null) {
    await db
      .update(employeeSession)
      .set({
        firstResponseMs: sql`coalesce(${employeeSession.firstResponseMs}, ${e2eMs})`,
      })
      .where(
        and(
          eq(employeeSession.id, input.sessionId),
          isNull(employeeSession.firstResponseMs),
        ),
      );
  }
}

export async function getTalkSessionMetricsSnapshot(
  sessionId: string,
): Promise<TalkSessionMetricsSnapshot> {
  const turns = await db
    .select({
      turnId: employeeSessionTurn.turnId,
      e2eMs: employeeSessionTurn.e2eMs,
      spans: employeeSessionTurn.spans,
      flags: employeeSessionTurn.flags,
      createdAt: employeeSessionTurn.createdAt,
    })
    .from(employeeSessionTurn)
    .where(eq(employeeSessionTurn.sessionId, sessionId))
    .orderBy(employeeSessionTurn.createdAt);

  const e2eValues = turns
    .map((turn) => turn.e2eMs)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  const percentile = (values: number[], p: number): number | null => {
    if (values.length === 0) {
      return null;
    }
    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.ceil((p / 100) * values.length) - 1),
    );
    return values[index] ?? null;
  };

  const average = (key: keyof TalkTurnSpans): number | null => {
    const values = turns
      .map((turn) => turn.spans?.[key])
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) {
      return null;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  const lastTurn = turns.at(-1);

  return {
    turnCount: turns.length,
    p50E2eMs: percentile(e2eValues, 50),
    p95E2eMs: percentile(e2eValues, 95),
    avgBuildMs: average("build"),
    avgRagMs: average("rag"),
    avgTtfbMs: average("ttfb"),
    lastTurn: lastTurn
      ? {
          turnId: lastTurn.turnId,
          e2eMs: lastTurn.e2eMs,
          spans: lastTurn.spans ?? {},
          flags: lastTurn.flags ?? {},
          createdAt: lastTurn.createdAt.toISOString(),
        }
      : null,
  };
}
