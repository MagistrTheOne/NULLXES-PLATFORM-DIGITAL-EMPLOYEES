import { and, eq, inArray } from "drizzle-orm";
import { employeeRuntime } from "@/entities/runtime/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { applySessionDurationLimit } from "./enforce-session-limit";

/** Sessions stuck in `created` without Anam activation. */
export const CREATED_SESSION_GRACE_SECONDS = 10 * 60;

export async function expireStaleEmployeeSessions(): Promise<{
  expiredActive: number;
  expiredCreated: number;
}> {
  const openRows = await db
    .select({
      id: employeeSession.id,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      sessionLimitSeconds: employeeRuntime.sessionLimitSeconds,
    })
    .from(employeeSession)
    .innerJoin(
      employeeRuntime,
      eq(employeeRuntime.employeeId, employeeSession.employeeId),
    )
    .where(inArray(employeeSession.status, ["created", "active"]));

  const now = Date.now();
  let expiredActive = 0;
  let expiredCreated = 0;

  for (const row of openRows) {
    const startedMs = row.startedAt.getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - startedMs) / 1000));

    if (row.status === "created") {
      if (elapsedSeconds < CREATED_SESSION_GRACE_SECONDS) {
        continue;
      }

      const updated = await db
        .update(employeeSession)
        .set({
          status: "failed",
          endedAt: new Date(),
          durationSeconds: 0,
        })
        .where(
          and(
            eq(employeeSession.id, row.id),
            eq(employeeSession.status, "created"),
          ),
        )
        .returning({ id: employeeSession.id });

      if (updated.length > 0) {
        expiredCreated += 1;
      }

      continue;
    }

    if (elapsedSeconds <= row.sessionLimitSeconds) {
      continue;
    }

    const endedAt = new Date();
    const limited = applySessionDurationLimit({
      startedAt: row.startedAt,
      endedAt,
      sessionLimitSeconds: row.sessionLimitSeconds,
    });

    const updated = await db
      .update(employeeSession)
      .set({
        status: limited.status,
        endedAt,
        durationSeconds: limited.durationSeconds,
      })
      .where(
        and(
          eq(employeeSession.id, row.id),
          eq(employeeSession.status, "active"),
        ),
      )
      .returning({ id: employeeSession.id });

    if (updated.length > 0) {
      expiredActive += 1;
    }
  }

  return { expiredActive, expiredCreated };
}
