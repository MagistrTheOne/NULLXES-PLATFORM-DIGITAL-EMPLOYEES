import { getEmployeeTasks } from "../services/get-employee-tasks";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { requireWorkspacePermission } from "@/features/workspace";
import { EmployeeTasksPanel } from "./employee-tasks-panel";

export async function EmployeeDetailTasksTab({
  organizationId,
  employeeId,
  displayPreferences,
}: {
  organizationId: string;
  employeeId: string;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const [items, workspace] = await Promise.all([
    getEmployeeTasks(organizationId, employeeId),
    requireWorkspacePermission("canManageEmployees").catch(() => null),
  ]);

  return (
    <EmployeeTasksPanel
      items={items}
      employeeId={employeeId}
      canManage={Boolean(workspace)}
      displayPreferences={displayPreferences}
    />
  );
}
