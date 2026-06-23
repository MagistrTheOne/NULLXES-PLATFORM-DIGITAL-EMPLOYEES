import { getEmployeeDetailKnowledge } from "../services/get-employee-detail";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { EmployeeKnowledgePanel } from "./employee-knowledge-panel";

export async function EmployeeDetailKnowledgeTab({
  organizationId,
  employeeId,
  displayPreferences,
}: {
  organizationId: string;
  employeeId: string;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const items = await getEmployeeDetailKnowledge(organizationId, employeeId);

  return (
    <EmployeeKnowledgePanel
      items={items}
      displayPreferences={displayPreferences}
    />
  );
}
