import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import { HqScreen, getHqState } from "@/features/hq";
import { HQ_DEPARTMENTS, type HqDepartment } from "@/features/hq/types";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default async function NullxesHqPage({
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
      (error instanceof Error && error.message.includes("database temporarily unreachable"))
    ) {
      throw new Error("Failed to load hq: database temporarily unreachable");
    }
    throw error;
  }

  let workspace;
  try {
    workspace = await ensureWorkspace(session.user.id, session.user.name);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error("Failed to load hq: database temporarily unreachable");
    }
    throw error;
  }

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const resolved = await searchParams;
  const raw = Array.isArray(resolved.department)
    ? resolved.department[0]
    : resolved.department;
  const initialDepartment: HqDepartment | null = HQ_DEPARTMENTS.includes(
    raw as HqDepartment,
  )
    ? (raw as HqDepartment)
    : null;

  let state;
  try {
    state = await getHqState(workspace.organization.id);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error("Failed to load hq: database temporarily unreachable");
    }
    throw error;
  }

  return <HqScreen state={state} initialDepartment={initialDepartment} />;
}
