import { redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { hasWorkspaceAccess } from "@/features/workspace";
import {
  EmployeesScreen,
  listOrganizationEmployees,
} from "@/features/employees";

export default async function DigitalEmployeesPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(
    session.user.id,
    session.user.name,
  );

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const employees = await listOrganizationEmployees(workspace.organization.id);

  return <EmployeesScreen employees={employees} />;
}
