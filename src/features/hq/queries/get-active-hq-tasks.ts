import { and, desc, eq, gt, lte } from "drizzle-orm";
import { hqTask, type HqTaskDestination } from "@/entities/hq-task";
import { db } from "@/shared/db/client";

export type ActiveHqTask = {
  destination: HqTaskDestination;
  label: string;
  startedAt: Date;
  expiresAt: Date;
};

/**
 * Resolve the currently-running floor errand per employee. Also lazily retires
 * expired errands (status -> done) so the floor returns employees to their desk
 * without a background worker. Keeps the latest running task per employee.
 */
export async function getActiveHqTasks(
  organizationId: string,
): Promise<Map<string, ActiveHqTask>> {
  const now = new Date();

  await db
    .update(hqTask)
    .set({ status: "done", completedAt: now })
    .where(
      and(
        eq(hqTask.organizationId, organizationId),
        eq(hqTask.status, "running"),
        lte(hqTask.expiresAt, now),
      ),
    );

  const rows = await db
    .select({
      employeeId: hqTask.employeeId,
      destination: hqTask.destination,
      label: hqTask.label,
      startedAt: hqTask.startedAt,
      expiresAt: hqTask.expiresAt,
    })
    .from(hqTask)
    .where(
      and(
        eq(hqTask.organizationId, organizationId),
        eq(hqTask.status, "running"),
        gt(hqTask.expiresAt, now),
      ),
    )
    .orderBy(desc(hqTask.startedAt));

  const active = new Map<string, ActiveHqTask>();
  for (const row of rows) {
    if (active.has(row.employeeId)) {
      continue;
    }
    active.set(row.employeeId, {
      destination: row.destination,
      label: row.label,
      startedAt: row.startedAt,
      expiresAt: row.expiresAt,
    });
  }

  return active;
}
