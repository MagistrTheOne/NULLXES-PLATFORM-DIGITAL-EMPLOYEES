import { desc, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type { RecentLifecycleEventRow } from "../types";

const RECENT_LIFECYCLE_LIMIT = 12;

export async function getRecentLifecycleEvents(
  organizationId: string,
): Promise<RecentLifecycleEventRow[]> {
  const rows = await db
    .select({
      id: employeeLifecycleEvent.id,
      eventType: employeeLifecycleEvent.eventType,
      reason: employeeLifecycleEvent.reason,
      employeeId: digitalEmployee.id,
      employeeName: digitalEmployee.name,
      actorName: user.name,
      createdAt: employeeLifecycleEvent.createdAt,
    })
    .from(employeeLifecycleEvent)
    .innerJoin(
      digitalEmployee,
      eq(employeeLifecycleEvent.employeeId, digitalEmployee.id),
    )
    .innerJoin(user, eq(employeeLifecycleEvent.actorUserId, user.id))
    .where(eq(digitalEmployee.organizationId, organizationId))
    .orderBy(desc(employeeLifecycleEvent.createdAt))
    .limit(RECENT_LIFECYCLE_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    eventType: row.eventType,
    reason: row.reason,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    actorName: row.actorName,
    createdAt: row.createdAt,
  }));
}
