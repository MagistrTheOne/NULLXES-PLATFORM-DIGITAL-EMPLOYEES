import { getDefaultAnalyticsRange } from "@/features/analytics/lib/date-range";
import { getEmployeeSessionSummaries } from "@/features/overview/queries/get-employee-session-summaries";
import { getLiveSessions } from "@/features/overview/queries/get-live-sessions";
import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import {
  deriveEmployeeActivity,
  deriveRuntimeStatus,
} from "../lib/derive-employee-activity";
import { DEPARTMENT_ORDER } from "../lib/department-layout";
import { resolveEmployeeDepartment } from "../lib/map-employee-department";
import { getActiveHqTasks } from "../queries/get-active-hq-tasks";
import {
  emptyPerformance,
  getEmployeePerformance,
} from "../queries/get-employee-performance";
import {
  emptyTaskSnapshot,
  getEmployeeTaskSnapshots,
} from "../queries/get-employee-task-snapshots";
import type {
  HqDepartmentGroup,
  HqDepartmentMetrics,
  HqEmployee,
  HqState,
} from "../types";

/**
 * Server snapshot of the headquarters floor: every employee placed in a
 * department with a derived live activity. Realtime deltas (Stream channel)
 * patch this snapshot on the client.
 */
export async function getHqState(organizationId: string): Promise<HqState> {
  return withDatabaseRetry(async () => {
    const range = getDefaultAnalyticsRange();
    const [
      employees,
      summaries,
      liveSessions,
      taskSnapshots,
      performance,
      activeTasks,
    ] = await Promise.all([
      listOrganizationEmployees(organizationId).then((page) => page.items),
      getEmployeeSessionSummaries(organizationId, range),
      getLiveSessions(organizationId),
      getEmployeeTaskSnapshots(organizationId),
      getEmployeePerformance(organizationId, range),
      getActiveHqTasks(organizationId),
    ]);

    const summaryByEmployeeId = new Map(
      summaries.map((summary) => [summary.employeeId, summary]),
    );
    const liveEmployeeIds = new Set(
      liveSessions.map((session) => session.employeeId),
    );

    const hqEmployees: HqEmployee[] = employees.map((employee) => {
      const summary = summaryByEmployeeId.get(employee.id);
      const isLive = liveEmployeeIds.has(employee.id);
      const sessionsInRange = summary?.sessionsInRange ?? 0;
      const tasks = taskSnapshots.get(employee.id) ?? emptyTaskSnapshot();
      const perf = performance.get(employee.id) ?? emptyPerformance();
      const activeTask = activeTasks.get(employee.id) ?? null;
      const activityInput = { isLive, status: employee.status, tasks };

      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        status: employee.status,
        runtimeStatus: deriveRuntimeStatus(activityInput),
        brainProvider: employee.brainProvider,
        avatarPreviewUrl: employee.avatarPreviewUrl,
        avatarProvisioningStatus: employee.avatarProvisioningStatus,
        department: resolveEmployeeDepartment(
          employee.department,
          employee.role,
        ),
        activity: deriveEmployeeActivity(activityInput),
        task: activeTask
          ? { destination: activeTask.destination, label: activeTask.label }
          : null,
        sessionsInRange,
        conversationSeconds: perf.conversationSeconds,
        satisfactionAvg: perf.satisfactionAvg,
        lastSessionAt: summary?.lastSessionAt ?? null,
        tasksToday: tasks.tasksToday,
        createdAt: employee.createdAt,
        isLive,
        canTalk: employee.canTalk,
      };
    });

    const departments: HqDepartmentGroup[] = DEPARTMENT_ORDER.map(
      (department) => ({
        department,
        employees: hqEmployees.filter(
          (employee) => employee.department === department,
        ),
      }),
    );

    const departmentMetrics: HqDepartmentMetrics[] = departments.map(
      (group) => {
        const total = group.employees.length;
        const active = group.employees.filter(
          (employee) => employee.status === "active",
        ).length;
        const live = group.employees.filter(
          (employee) => employee.isLive,
        ).length;
        const sessions = group.employees.reduce(
          (sum, employee) => sum + employee.sessionsInRange,
          0,
        );
        const conversationSeconds = group.employees.reduce(
          (sum, employee) => sum + employee.conversationSeconds,
          0,
        );
        const rated = group.employees.filter(
          (employee) => employee.satisfactionAvg !== null,
        );
        const satisfactionAvg =
          rated.length > 0
            ? rated.reduce(
                (sum, employee) => sum + (employee.satisfactionAvg ?? 0),
                0,
              ) / rated.length
            : null;

        return {
          department: group.department,
          total,
          active,
          live,
          utilization: total > 0 ? Math.round((active / total) * 100) : 0,
          sessions,
          conversationSeconds,
          satisfactionAvg,
        };
      },
    );

    return {
      employees: hqEmployees,
      departments,
      departmentMetrics,
      liveCount: liveEmployeeIds.size,
    };
  });
}
