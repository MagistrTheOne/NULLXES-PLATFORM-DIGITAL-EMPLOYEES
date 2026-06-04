import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { EmployeeTalkSession } from "@/features/runtime-session/components/employee-talk-session";
import { createAnamTalkSessionTokenForEmployee } from "@/features/runtime-session/services/create-anam-talk-session";
import { createTalkChatSession } from "@/features/runtime-session/services/create-talk-chat-session";

export default async function EmployeeTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const employee = await getEmployeeDetail(workspace.organization.id, id);

  if (!employee) {
    notFound();
  }

  if (!employee.canTalk) {
    redirect(`/dashboard/employees/${id}`);
  }

  const [chatSession, anamToken] = await Promise.all([
    createTalkChatSession(
      workspace.organization.id,
      id,
      session.user.id,
      session.user.name,
    ),
    createAnamTalkSessionTokenForEmployee(workspace.organization.id, id),
  ]);

  if (!chatSession || !anamToken.ok) {
    redirect(`/dashboard/employees/${id}`);
  }

  return (
    <EmployeeTalkSession
      employeeName={employee.name}
      chatSession={chatSession}
      anamSessionToken={anamToken.sessionToken}
      employeeId={employee.id}
      avatarPreviewUrl={employee.avatarPreviewUrl}
    />
  );
}
