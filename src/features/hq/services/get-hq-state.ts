import { getOrganizationAnalyticsRange } from "@/features/analytics/lib/get-organization-analytics-range";
import { getEmployeeSessionSummaries } from "@/features/overview/queries/get-employee-session-summaries";
import { getLiveSessions } from "@/features/overview/queries/get-live-sessions";
import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import {
  emptyLoadout,
  equippedSkillCount,
} from "@/features/rewards/lib/loadout";
import { listOrganizationLoadouts } from "@/features/rewards/services/employee-loadout";
import { getRewardsWorkspaceState } from "@/features/rewards/services/get-rewards-workspace-state";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import {
  deriveEmployeeActivity,
  deriveRuntimeStatus,
} from "../lib/derive-employee-activity";
import {
  DEPARTMENT_CAPACITY,
  DEPARTMENT_ORDER,
} from "../lib/department-layout";
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
import { getHqFloorActivity } from "../queries/get-hq-floor-activity";
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
    const range = await getOrganizationAnalyticsRange(organizationId);
    const [
      employees,
      summaries,
      liveSessions,
      taskSnapshots,
      performance,
      activeTasks,
      floorActivity,
      loadouts,
      rewardsState,
    ] = await Promise.all([
      listOrganizationEmployees(organizationId).then((page) => page.items),
      getEmployeeSessionSummaries(organizationId, range),
      getLiveSessions(organizationId),
      getEmployeeTaskSnapshots(organizationId),
      getEmployeePerformance(organizationId, range),
      getActiveHqTasks(organizationId),
      getHqFloorActivity(organizationId),
      listOrganizationLoadouts(organizationId).catch(
        (): Record<string, import("@/features/rewards/lib/loadout").EmployeeLoadout> => ({}),
      ),
      getRewardsWorkspaceState(organizationId).catch(() => null),
    ]);

    const rewardNameBySlug = new Map(
      (rewardsState?.rewards ?? []).map((item) => [item.id, item.name]),
    );

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
      const missionHint = floorActivity.missionByEmployeeId.get(employee.id);
      const loadout = loadouts[employee.id] ?? emptyLoadout();
      const equippedSlots =
        [
          loadout.appearanceId,
          loadout.voiceId,
          loadout.backgroundId,
          loadout.idleId,
          loadout.frameId,
        ].filter(Boolean).length + equippedSkillCount(loadout);
      const hasLoadout = equippedSlots > 0;

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
        mission: missionHint
          ? {
              missionId: missionHint.missionId,
              title: missionHint.title,
              status: missionHint.status,
              stage: missionHint.stage,
              lastAction: missionHint.lastAction,
            }
          : null,
        loadout: hasLoadout
          ? {
              appearanceSlug: loadout.appearanceId,
              appearanceName: loadout.appearanceId
                ? (rewardNameBySlug.get(loadout.appearanceId) ??
                  loadout.appearanceId)
                : null,
              equippedSlots,
            }
          : null,
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
        const capacity = DEPARTMENT_CAPACITY[group.department];
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
          capacity,
          utilization:
            capacity > 0 ? Math.round((total / capacity) * 100) : 0,
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
      opsItems: floorActivity.opsItems,
      recentTimeline: floorActivity.recentTimeline,
    };
  });
}
