import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import {
  EmployeesScreen,
  listOrganizationEmployees,
} from "@/features/employees";
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
    if (isTransientDatabaseError(error) || (error instanceof Error && error.message.includes("database temporarily unreachable"))) {
      throw new Error("Failed to load employees: database temporarily unreachable");
    }
    throw error;
  }

  let workspace;
  try {
    workspace = await ensureWorkspace(session.user.id, session.user.name);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error("Failed to load employees: database temporarily unreachable");
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
  try {
    page = await listOrganizationEmployees(workspace.organization.id, {
      cursor,
    });
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error("Failed to load employees: database temporarily unreachable");
    }
    throw error;
  }

  return (
    <EmployeesScreen
      employees={page.items}
      nextCursor={page.nextCursor}
    />
  );
}
