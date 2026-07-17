import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { CollectionScreen } from "@/features/collection/components/collection-screen";
import { getRewardsWorkspaceState } from "@/features/rewards/services/get-rewards-workspace-state";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function CollectionPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const state = await getRewardsWorkspaceState(workspace.organization.id);

  return <CollectionScreen rewards={state.rewards} />;
}
