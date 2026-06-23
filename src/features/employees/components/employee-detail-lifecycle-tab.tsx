import { getEmployeeDetailLifecycle } from "../services/get-employee-detail";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { requireWorkspacePermission } from "@/features/workspace";
import { EmployeeHandoffsPanel } from "./employee-handoffs-panel";
import { EmployeeLifecyclePanel } from "./employee-lifecycle-panel";

export async function EmployeeDetailLifecycleTab({
  organizationId,
  employeeId,
  displayPreferences,
}: {
  organizationId: string;
  employeeId: string;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const [{ lifecycle, handoffs }, workspace] = await Promise.all([
    getEmployeeDetailLifecycle(organizationId, employeeId),
    requireWorkspacePermission("canManageEmployees").catch(() => null),
  ]);

  return (
    <div className="space-y-4">
      <EmployeeLifecyclePanel
        items={lifecycle}
        displayPreferences={displayPreferences}
      />
      <EmployeeHandoffsPanel
        items={handoffs}
        canManage={Boolean(workspace)}
      />
    </div>
  );
}
