import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { EmployeeTalkSession } from "@/features/runtime-session/components/employee-talk-session";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeTalkPage({
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

  const brainModelLabel = formatBrainModelDisplay({
    provider: employee.brainProvider,
    modelId: resolveBrainModelForProvider(
      employee.brainProvider,
      employee.brainModel,
    ),
  });

  return (
    <EmployeeTalkSession
      employeeName={employee.name}
      chatSession={null}
      actorUserId={session.user.id}
      actorUserName={session.user.name}
      employeeId={employee.id}
      avatarPreviewUrl={employee.avatarPreviewUrl}
      sessionLimitSeconds={employee.sessionLimitSeconds}
      brainModelLabel={brainModelLabel}
    />
  );
}
