import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { listOrganizationEmployees } from "@/features/employees";
import {
  listOrganizationMissions,
  MissionsScreen,
} from "@/features/missions";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function MissionsPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const { items } = await listOrganizationMissions(workspace.organization.id);

  return (
    <MissionsScreen
      missions={items}
      canCreate={workspace.permissions.canOperateEmployees}
    />
  );
}
