import { getEmployeeDetailKnowledge } from "../services/get-employee-detail";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { requireWorkspacePermission } from "@/features/workspace";
import { EmployeeKnowledgePanel } from "./employee-knowledge-panel";

export async function EmployeeDetailKnowledgeTab({
  organizationId,
  employeeId,
  displayPreferences,
  isPlatformAdmin = false,
}: {
  organizationId: string;
  employeeId: string;
  displayPreferences: OrganizationDisplayPreferences;
  isPlatformAdmin?: boolean;
}) {
  const [items, workspace] = await Promise.all([
    getEmployeeDetailKnowledge(organizationId, employeeId),
    requireWorkspacePermission("canManageEmployees").catch(() => null),
  ]);

  return (
    <EmployeeKnowledgePanel
      items={items}
      employeeId={employeeId}
      canManage={Boolean(workspace)}
      displayPreferences={displayPreferences}
      isPlatformAdmin={isPlatformAdmin}
    />
  );
}
