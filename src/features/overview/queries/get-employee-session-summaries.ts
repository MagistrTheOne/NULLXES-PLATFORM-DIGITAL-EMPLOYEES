import { and, count, eq, gte, lte, max } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";
import { endOfUtcDay, startOfUtcDay } from "@/features/analytics/lib/date-range";
import type { AnalyticsDateRange } from "@/features/analytics/types";
import type { EmployeeSessionSummary } from "../types";

export async function getEmployeeSessionSummaries(
  organizationId: string,
  range: AnalyticsDateRange,
): Promise<EmployeeSessionSummary[]> {
  return withTenantContext(organizationId, async (tx) => {
    const rows = await tx
      .select({
        employeeId: employeeSession.employeeId,
        sessionsInRange: count(employeeSession.id),
        lastSessionAt: max(employeeSession.startedAt),
      })
      .from(employeeSession)
      .innerJoin(
        digitalEmployee,
        eq(employeeSession.employeeId, digitalEmployee.id),
      )
      .where(
        and(
          eq(employeeSession.organizationId, organizationId),
          gte(employeeSession.startedAt, startOfUtcDay(range.from)),
          lte(employeeSession.startedAt, endOfUtcDay(range.to)),
        ),
      )
      .groupBy(employeeSession.employeeId);

    return rows.map((row) => ({
      employeeId: row.employeeId,
      sessionsInRange: Number(row.sessionsInRange),
      lastSessionAt: row.lastSessionAt,
    }));
  });
}
