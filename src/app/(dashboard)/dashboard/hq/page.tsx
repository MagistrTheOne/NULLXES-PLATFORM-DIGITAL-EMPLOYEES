import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import { HqScreen, getHqState } from "@/features/hq";
import { HQ_DEPARTMENTS, type HqDepartment } from "@/features/hq/types";

export default async function NullxesHqPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

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

  const state = await getHqState(workspace.organization.id);

  return <HqScreen state={state} initialDepartment={initialDepartment} />;
}
