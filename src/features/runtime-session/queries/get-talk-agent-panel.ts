import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { endOfUtcDay, startOfUtcDay } from "@/features/analytics/lib/date-range";
import { employeeTask } from "@/entities/task/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";

export type TalkAgentPanelStats = {
  conversationsToday: number;
  satisfaction: number | null;
  talkTimeSeconds: number;
};

export type TalkAgentPanel = {
  stats: TalkAgentPanelStats;
  currentTaskTitle: string | null;
};

/**
 * Lightweight stats for the Talk agent details panel: today's conversation
 * volume, total talk time and mean satisfaction, plus the current in-progress
 * task title. Scoped by employee (already org-authorized by the caller).
 */
export async function getTalkAgentPanel(
  employeeId: string,
): Promise<TalkAgentPanel> {
  return withDatabaseRetry(() => loadTalkAgentPanel(employeeId));
}

async function loadTalkAgentPanel(employeeId: string): Promise<TalkAgentPanel> {
  const now = new Date();

  const [statsRow, taskRow] = await Promise.all([
    db
      .select({
        sessions: count(employeeSession.id),
        talkTime:
          sql<number>`coalesce(sum(${employeeSession.durationSeconds}), 0)`.mapWith(
            Number,
          ),
        satisfactionAvg: sql<
          number | null
        >`avg(${employeeSession.satisfactionRating})`,
        satisfactionCount: count(employeeSession.satisfactionRating),
      })
      .from(employeeSession)
      .where(
        and(
          eq(employeeSession.employeeId, employeeId),
          gte(employeeSession.startedAt, startOfUtcDay(now)),
          lte(employeeSession.startedAt, endOfUtcDay(now)),
        ),
      ),
    db
      .select({ title: employeeTask.title })
      .from(employeeTask)
      .where(
        and(
          eq(employeeTask.employeeId, employeeId),
          eq(employeeTask.status, "in_progress"),
        ),
      )
      .orderBy(desc(employeeTask.createdAt))
      .limit(1),
  ]);

  const row = statsRow[0];

  return {
    stats: {
      conversationsToday: Number(row?.sessions ?? 0),
      talkTimeSeconds: Number(row?.talkTime ?? 0),
      satisfaction:
        row && Number(row.satisfactionCount) > 0 && row.satisfactionAvg !== null
          ? Number(row.satisfactionAvg)
          : null,
    },
    currentTaskTitle: taskRow[0]?.title ?? null,
  };
}
