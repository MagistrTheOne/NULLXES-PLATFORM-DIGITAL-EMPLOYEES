import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import { listOrganizationLoadouts } from "@/features/rewards/services/employee-loadout";
import { getRewardsWorkspaceState } from "@/features/rewards/services/get-rewards-workspace-state";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function InventoryPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const orgId = workspace.organization.id;
  const [state, employeePage, loadouts] = await Promise.all([
    getRewardsWorkspaceState(orgId),
    listOrganizationEmployees(orgId, { limit: 50 }),
    listOrganizationLoadouts(orgId),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-[#121212] p-6 text-sm text-white/40">
          Loading inventory…
        </div>
      }
    >
      <InventoryScreen
        rewards={state.rewards}
        employees={employeePage.items.map((e) => ({ id: e.id, name: e.name }))}
        loadouts={loadouts}
      />
    </Suspense>
  );
}
