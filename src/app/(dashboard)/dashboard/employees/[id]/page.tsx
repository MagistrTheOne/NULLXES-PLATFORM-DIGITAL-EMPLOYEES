import { notFound } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getOrganizationDisplayPreferences } from "@/features/workspace/services/get-organization-display-preferences";
import {
  EmployeeDetailScreen,
  getEmployeeDetail,
} from "@/features/employees";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const [employee, displayPreferences] = await Promise.all([
    getEmployeeDetail(workspace.organization.id, id),
    getOrganizationDisplayPreferences(workspace.organization.id),
  ]);

  if (!employee) {
    notFound();
  }

  return (
    <EmployeeDetailScreen
      employee={employee}
      displayPreferences={displayPreferences}
    />
  );
}
