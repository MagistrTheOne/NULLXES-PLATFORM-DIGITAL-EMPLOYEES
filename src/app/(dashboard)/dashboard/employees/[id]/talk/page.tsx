import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { EmployeeTalkRoom } from "@/features/runtime-session/components/employee-talk-room";
import { createAnamTalkSessionTokenForEmployee } from "@/features/runtime-session/services/create-anam-talk-session";
import { createTalkChatSession } from "@/features/runtime-session/services/create-talk-chat-session";
import { createTalkSession } from "@/features/runtime-session/services/create-talk-session";

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

  const [talkSession, chatSession, anamToken] = await Promise.all([
    createTalkSession(
      workspace.organization.id,
      id,
      session.user.id,
      session.user.name,
    ),
    createTalkChatSession(
      workspace.organization.id,
      id,
      session.user.id,
      session.user.name,
    ),
    createAnamTalkSessionTokenForEmployee(workspace.organization.id, id),
  ]);

  if (!talkSession || !chatSession || !anamToken.ok) {
    redirect(`/dashboard/employees/${id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-white/60 hover:bg-white/5 hover:text-white"
          asChild
        >
          <Link href="/dashboard/employees">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Talk · {employee.name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Live session · chat · optional camera
          </p>
        </div>
      </div>
      <EmployeeTalkRoom
        streamSession={talkSession}
        chatSession={chatSession}
        anamSessionToken={anamToken.sessionToken}
        employeeId={employee.id}
        employeeName={employee.name}
        avatarPreviewUrl={employee.avatarPreviewUrl}
      />
    </div>
  );
}
