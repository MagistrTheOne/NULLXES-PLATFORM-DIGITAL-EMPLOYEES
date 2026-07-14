import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import { getRewardsWorkspaceState } from "@/features/rewards/services/get-rewards-workspace-state";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function InventoryPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const state = await getRewardsWorkspaceState(workspace.organization.id);

  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-[#121212] p-6 text-sm text-white/40">
          Loading inventory…
        </div>
      }
    >
      <InventoryScreen rewards={state.rewards} />
    </Suspense>
  );
}
