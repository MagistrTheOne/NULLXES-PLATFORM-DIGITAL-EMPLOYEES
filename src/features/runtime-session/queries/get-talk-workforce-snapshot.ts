import { and, count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { hqTask } from "@/entities/hq-task";
import { getActiveSessionCount } from "@/features/overview/queries/get-active-session-count";
import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { getSystemStatus } from "@/features/overview/services/get-system-status";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";

export type TalkWorkforceSnapshot = {
  liveSessions: number;
  employeesOnline: number;
  employeesTotal: number;
  tasksInProgress: number;
  systemLoadPercent: number;
  uptimePercent: number;
  uptimeLabel: string;
};

function formatUptimeLabel(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

async function countActiveTasks(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(hqTask)
    .innerJoin(digitalEmployee, eq(hqTask.employeeId, digitalEmployee.id))
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        eq(hqTask.status, "running"),
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getTalkWorkforceSnapshot(
  organizationId: string,
): Promise<TalkWorkforceSnapshot> {
  return withDatabaseRetry(async () => {
    const [liveSessions, employeesPage, tasksInProgress, systemStatus] =
      await Promise.all([
        getActiveSessionCount(organizationId),
        listOrganizationEmployees(organizationId),
        countActiveTasks(organizationId),
        Promise.resolve(getSystemStatus()),
      ]);

    const employeesTotal = employeesPage.items.length;
    const employeesOnline = employeesPage.items.filter(
      (employee) => employee.status === "active",
    ).length;

    const operational = systemStatus.filter(
      (item) => item.status === "operational",
    ).length;
    // Load = share of systems NOT fully operational. All healthy → 0% (Optimal),
    // everything degraded → 100% (High). The previous formula used the
    // operational share, which inverted the health indicator.
    const systemLoadPercent =
      systemStatus.length > 0
        ? Math.round(
            ((systemStatus.length - operational) / systemStatus.length) * 100,
          )
        : 0;

    const uptimeSeconds = process.uptime();
    const uptimePercent = Math.min(99.99, 99.5 + operational * 0.08);

    return {
      liveSessions,
      employeesOnline,
      employeesTotal,
      tasksInProgress,
      systemLoadPercent,
      uptimePercent,
      uptimeLabel: formatUptimeLabel(uptimeSeconds),
    };
  });
}
