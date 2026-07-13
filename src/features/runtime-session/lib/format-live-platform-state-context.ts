import { listEmployeeMissionsForAgentTool } from "@/features/missions/queries/list-employee-missions-for-agent-tool";
import { getEmployeeTasks } from "@/features/employees/services/get-employee-tasks";

/**
 * Compact live snapshot injected into Talk system prompt so the model
 * cannot invent mission/task status when tools are degraded or unused.
 */
export async function formatLivePlatformStateContext(input: {
  organizationId: string;
  employeeId: string;
}): Promise<string> {
  const [missions, tasks] = await Promise.all([
    listEmployeeMissionsForAgentTool({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      limit: 3,
    }),
    getEmployeeTasks(input.organizationId, input.employeeId, 5),
  ]);

  const taskLines =
    tasks.length === 0
      ? "No tasks on record."
      : tasks
          .map(
            (task) =>
              `- [${task.status}] ${task.title}${task.dueAt ? ` · due ${task.dueAt.toISOString().slice(0, 10)}` : ""}`,
          )
          .join("\n");

  return [
    "Live platform state (authoritative — do not invent or roleplay past this):",
    "",
    "Missions:",
    missions,
    "",
    "Recent tasks:",
    taskLines,
  ].join("\n");
}
