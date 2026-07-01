import { getLocale, getTranslations } from "next-intl/server";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { resolveEmployeeDepartment } from "@/features/hq/lib/map-employee-department";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { getScenarioSessionForUser } from "@/features/scenarios/services/scenario-session";
import { getTalkAgentPanel } from "@/features/runtime-session/queries/get-talk-agent-panel";
import { getTalkAgentActivity } from "@/features/runtime-session/queries/get-talk-agent-activity";
import { buildTalkAgentDetails } from "@/features/runtime-session/lib/build-talk-agent-details";
import { getTalkWorkforceSnapshot } from "@/features/runtime-session/queries/get-talk-workforce-snapshot";
import { EmployeeTalkSession } from "@/features/runtime-session/components/employee-talk-session";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeTalkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { id } = await params;
  const { scenario: scenarioSessionId } = await searchParams;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const employee = await getEmployeeTalkContext(workspace.organization.id, id);

  if (!employee) {
    notFound();
  }

  if (!employee.canTalk) {
    redirect(`/dashboard/employees/${id}`);
  }

  let validatedScenarioSessionId: string | undefined;
  if (scenarioSessionId?.trim()) {
    const scenarioSession = await getScenarioSessionForUser({
      scenarioSessionId: scenarioSessionId.trim(),
      organizationId: workspace.organization.id,
      userId: session.user.id,
    });

    if (
      scenarioSession &&
      scenarioSession.employeeId === employee.id &&
      scenarioSession.status !== "completed" &&
      scenarioSession.status !== "abandoned"
    ) {
      validatedScenarioSessionId = scenarioSession.id;
    }
  }

  const brainModelLabel = formatBrainModelDisplay({
    provider: employee.brainProvider,
    modelId: resolveBrainModelForProvider(
      employee.brainProvider,
      employee.brainModel,
    ),
  });

  const [panel, activity, locale, tHq, workforceSnapshot] = await Promise.all([
    getTalkAgentPanel(employee.id),
    getTalkAgentActivity(employee.id),
    getLocale(),
    getTranslations("hq.departments"),
    getTalkWorkforceSnapshot(workspace.organization.id),
  ]);

  const departmentSlug = resolveEmployeeDepartment(
    employee.department,
    employee.role,
  );
  const departmentLabel = tHq(departmentSlug);

  const agentDetails = buildTalkAgentDetails({
    employee,
    panel,
    locale,
    activity,
    modelLabel: brainModelLabel,
  });

  return (
    <EmployeeTalkSession
      employeeName={employee.name}
      chatSession={null}
      actorUserId={session.user.id}
      actorUserName={session.user.name}
      employeeId={employee.id}
      scenarioSessionId={validatedScenarioSessionId}
      avatarPreviewUrl={employee.avatarPreviewUrl}
      sessionLimitSeconds={employee.sessionLimitSeconds}
      brainModelLabel={brainModelLabel}
      agentDetails={agentDetails}
      viewer={{
        name: workspace.user.name,
        image: workspace.user.image,
        role: workspace.permissions.role,
      }}
      departmentLabel={departmentLabel}
      workforceSnapshot={workforceSnapshot}
    />
  );
}
