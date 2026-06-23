import { getEmployeeTasks } from "../services/get-employee-tasks";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
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
  const items = await getEmployeeTasks(organizationId, employeeId);

  return (
    <EmployeeTasksPanel items={items} displayPreferences={displayPreferences} />
  );
}
