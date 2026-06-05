import { and, eq, gte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { db } from "@/shared/db/client";
import type { ActivityMetrics } from "../types";

function sevenDaysAgo(): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 7);
  return date;
}

export async function getActivityMetrics(
  organizationId: string,
): Promise<ActivityMetrics> {
  const since = sevenDaysAgo();

  const [row] = await db
    .select({
      createdEmployeesLast7Days:
        sql<number>`count(*) filter (where ${employeeLifecycleEvent.eventType} = 'created')`.mapWith(
          Number,
        ),
      activatedEmployeesLast7Days:
        sql<number>`count(*) filter (where ${employeeLifecycleEvent.eventType} = 'activated')`.mapWith(
          Number,
        ),
      archivedEmployeesLast7Days:
        sql<number>`count(*) filter (where ${employeeLifecycleEvent.eventType} = 'archived')`.mapWith(
          Number,
        ),
    })
    .from(employeeLifecycleEvent)
    .innerJoin(
      digitalEmployee,
      eq(employeeLifecycleEvent.employeeId, digitalEmployee.id),
    )
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        gte(employeeLifecycleEvent.createdAt, since),
      ),
    );

  return {
    createdEmployeesLast7Days: Number(row?.createdEmployeesLast7Days ?? 0),
    activatedEmployeesLast7Days: Number(row?.activatedEmployeesLast7Days ?? 0),
    archivedEmployeesLast7Days: Number(row?.archivedEmployeesLast7Days ?? 0),
  };
}
