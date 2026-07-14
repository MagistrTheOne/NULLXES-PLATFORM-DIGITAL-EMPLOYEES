import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { CapsulesScreen } from "@/features/capsules/components/capsules-screen";
import { listCapsuleOpenHistory } from "@/features/rewards/services/list-capsule-history";
import { getRewardsWorkspaceState } from "@/features/rewards/services/get-rewards-workspace-state";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function CapsulesPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const orgId = workspace.organization.id;
  const [state, history] = await Promise.all([
    getRewardsWorkspaceState(orgId),
    listCapsuleOpenHistory(orgId).catch(() => []),
  ]);

  return (
    <CapsulesScreen
      offers={state.offers}
      rewards={state.rewards}
      dailySecondsLeft={state.dailySecondsLeft}
      history={history}
    />
  );
}
