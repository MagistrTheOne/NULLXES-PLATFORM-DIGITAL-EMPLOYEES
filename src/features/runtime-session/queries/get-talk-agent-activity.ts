import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfUtcDay, startOfUtcDay } from "@/features/analytics/lib/date-range";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";

export type TalkActivityKind =
  | "connected"
  | "session_started"
  | "session_ended"
  | "speaking";

export type TalkActivityItem = {
  id: string;
  kind: TalkActivityKind;
  at: Date;
};

/**
 * Lightweight activity feed for the Talk agent details panel. Built from
 * today's employee_session rows — no new tables.
 */
export async function getTalkAgentActivity(
  employeeId: string,
  limit = 8,
): Promise<TalkActivityItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: employeeSession.id,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
    })
    .from(employeeSession)
    .where(
      and(
        eq(employeeSession.employeeId, employeeId),
        gte(employeeSession.startedAt, startOfUtcDay(now)),
        lte(employeeSession.startedAt, endOfUtcDay(now)),
      ),
    )
    .orderBy(desc(employeeSession.startedAt))
    .limit(Math.max(limit, 4));

  const items: TalkActivityItem[] = [];

  if (rows.length > 0) {
    const oldest = rows[rows.length - 1];
    items.push({
      id: `${oldest.id}-connected`,
      kind: "connected",
      at: oldest.startedAt,
    });
  }

  for (const row of [...rows].reverse()) {
    items.push({
      id: `${row.id}-started`,
      kind: "session_started",
      at: row.startedAt,
    });

    if (row.status === "active") {
      items.push({
        id: `${row.id}-speaking`,
        kind: "speaking",
        at: row.startedAt,
      });
    }

    if (row.endedAt) {
      items.push({
        id: `${row.id}-ended`,
        kind: "session_ended",
        at: row.endedAt,
      });
    }
  }

  return items.slice(-limit);
}
