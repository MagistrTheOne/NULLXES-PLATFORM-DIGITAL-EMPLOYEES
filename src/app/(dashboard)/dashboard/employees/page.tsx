import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import {
  EmployeesScreen,
  listOrganizationEmployees,
} from "@/features/employees";
import { listOrganizationLoadouts } from "@/features/rewards/services/employee-loadout";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default async function DigitalEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let session;
  try {
    session = await requireAuth();
  } catch (error: unknown) {
    if (
      isTransientDatabaseError(error) ||
      (error instanceof Error &&
        error.message.includes("database temporarily unreachable"))
    ) {
      throw new Error(
        "Failed to load employees: database temporarily unreachable",
      );
    }
    throw error;
  }

  let workspace;
  try {
    workspace = await ensureWorkspace(session.user.id, session.user.name);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error(
        "Failed to load employees: database temporarily unreachable",
      );
    }
    throw error;
  }

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const cursor =
    typeof resolvedSearchParams.cursor === "string"
      ? resolvedSearchParams.cursor
      : undefined;

  let page;
  let loadouts: Awaited<ReturnType<typeof listOrganizationLoadouts>>;
  try {
    [page, loadouts] = await Promise.all([
      listOrganizationEmployees(workspace.organization.id, {
        cursor,
      }),
      listOrganizationLoadouts(workspace.organization.id).catch(
        () => ({}) as Awaited<ReturnType<typeof listOrganizationLoadouts>>,
      ),
    ]);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error(
        "Failed to load employees: database temporarily unreachable",
      );
    }
    throw error;
  }

  return (
    <EmployeesScreen
      employees={page.items}
      nextCursor={page.nextCursor}
      loadouts={loadouts}
    />
  );
}
