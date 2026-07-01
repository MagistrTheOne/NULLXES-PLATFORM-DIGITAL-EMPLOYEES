import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { ScenarioPickerScreen } from "@/features/scenarios/components/scenario-picker-screen";
import { countScenariosThisMonth } from "@/features/scenarios/lib/scenario-free-limits";

export default async function EmployeeScenariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const employee = await getEmployeeTalkContext(workspace.organization.id, id);

  if (!employee) {
    notFound();
  }

  if (!employee.canTalk) {
    redirect(`/dashboard/employees/${id}`);
  }

  const scenariosUsedThisMonth = await countScenariosThisMonth({
    organizationId: workspace.organization.id,
    userId: session.user.id,
  });

  return (
    <ScenarioPickerScreen
      employeeId={employee.id}
      employeeName={employee.name}
      employeeRole={employee.role}
      scenariosUsedThisMonth={scenariosUsedThisMonth}
      billingPlan={workspace.organization.billingPlan as BillingPlanId}
    />
  );
}
