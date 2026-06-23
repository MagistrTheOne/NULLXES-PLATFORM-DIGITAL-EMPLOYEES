import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import {
  EmployeesScreen,
  listOrganizationEmployees,
} from "@/features/employees";

export default async function DigitalEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const cursor =
    typeof resolvedSearchParams.cursor === "string"
      ? resolvedSearchParams.cursor
      : undefined;

  const page = await listOrganizationEmployees(workspace.organization.id, {
    cursor,
  });

  return (
    <EmployeesScreen
      employees={page.items}
      nextCursor={page.nextCursor}
    />
  );
}
