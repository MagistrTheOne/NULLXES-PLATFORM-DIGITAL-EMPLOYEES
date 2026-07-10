import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
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
  const canCreateMissions =
    workspace.permissions.canOperateEmployees &&
    planAllowsCreateEmployees(
      resolveBillingPlanId(workspace.organization.billingPlan),
    );

  return (
    <MissionsScreen
      missions={items}
      canCreate={canCreateMissions}
    />
  );
}
