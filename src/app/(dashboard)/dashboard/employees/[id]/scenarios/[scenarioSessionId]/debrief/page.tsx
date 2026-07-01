import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { ScenarioDebriefScreen } from "@/features/scenarios/components/scenario-debrief-screen";
import { finalizeScenarioDebriefAction } from "@/features/scenarios/actions/scenario-session";
import { getScenarioSessionForUser } from "@/features/scenarios/services/scenario-session";

export default async function ScenarioDebriefPage({
  params,
}: {
  params: Promise<{ id: string; scenarioSessionId: string }>;
}) {
  const { id, scenarioSessionId } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  let scenarioSession = await getScenarioSessionForUser({
    scenarioSessionId,
    organizationId: workspace.organization.id,
    userId: session.user.id,
  });

  if (!scenarioSession || scenarioSession.employeeId !== id) {
    notFound();
  }

  if (!scenarioSession.debrief) {
    const result = await finalizeScenarioDebriefAction(scenarioSessionId);
    if (!result.ok) {
      redirect(`/dashboard/employees/${id}/scenarios`);
    }

    scenarioSession = await getScenarioSessionForUser({
      scenarioSessionId,
      organizationId: workspace.organization.id,
      userId: session.user.id,
    });
  }

  if (!scenarioSession?.debrief) {
    redirect(`/dashboard/employees/${id}/scenarios`);
  }

  return (
    <ScenarioDebriefScreen
      employeeId={id}
      employeeName={scenarioSession.employee.name}
      scenarioSessionId={scenarioSession.id}
      templateId={scenarioSession.templateId}
      debrief={scenarioSession.debrief}
      billingPlan={workspace.organization.billingPlan as BillingPlanId}
    />
  );
}
