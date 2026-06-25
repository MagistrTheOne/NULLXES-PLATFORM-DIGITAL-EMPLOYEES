import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { startOfUtcDay } from "@/features/analytics/lib/date-range";
import { employeeTask } from "@/entities/task/schema";
import { db } from "@/shared/db/client";

export type HqTaskSnapshot = {
  inProgressTitle: string | null;
  inProgressCount: number;
  pendingCount: number;
  tasksToday: number;
};

const EMPTY_SNAPSHOT: HqTaskSnapshot = {
  inProgressTitle: null,
  inProgressCount: 0,
  pendingCount: 0,
  tasksToday: 0,
};

export function emptyTaskSnapshot(): HqTaskSnapshot {
  return { ...EMPTY_SNAPSHOT };
}

/**
 * Real task signals per employee, used to drive floor activity badges
 * ("Interview", "Follow up", …) and the profile "Tasks today" metric.
 */
export async function getEmployeeTaskSnapshots(
  organizationId: string,
): Promise<Map<string, HqTaskSnapshot>> {
  const todayStart = startOfUtcDay(new Date());

  const [openTasks, todayCounts] = await Promise.all([
    db
      .select({
        employeeId: employeeTask.employeeId,
        title: employeeTask.title,
        status: employeeTask.status,
      })
      .from(employeeTask)
      .where(
        and(
          eq(employeeTask.organizationId, organizationId),
          inArray(employeeTask.status, ["pending", "in_progress"]),
        ),
      )
      .orderBy(desc(employeeTask.createdAt)),
    db
      .select({
        employeeId: employeeTask.employeeId,
        total: count(employeeTask.id),
      })
      .from(employeeTask)
      .where(
        and(
          eq(employeeTask.organizationId, organizationId),
          gte(employeeTask.createdAt, todayStart),
        ),
      )
      .groupBy(employeeTask.employeeId),
  ]);

  const snapshots = new Map<string, HqTaskSnapshot>();

  for (const row of openTasks) {
    const snapshot = snapshots.get(row.employeeId) ?? emptyTaskSnapshot();
    if (row.status === "in_progress") {
      snapshot.inProgressCount += 1;
      // Tasks are ordered newest-first; keep the most recent in-progress title.
      if (!snapshot.inProgressTitle) {
        snapshot.inProgressTitle = row.title;
      }
    } else {
      snapshot.pendingCount += 1;
    }
    snapshots.set(row.employeeId, snapshot);
  }

  for (const row of todayCounts) {
    const snapshot = snapshots.get(row.employeeId) ?? emptyTaskSnapshot();
    snapshot.tasksToday = Number(row.total);
    snapshots.set(row.employeeId, snapshot);
  }

  return snapshots;
}
