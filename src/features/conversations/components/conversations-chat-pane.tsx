"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { NullxesConversationHeader } from "@/features/conversations/workspace";
import type { ConversationEmployee } from "./conversations-screen";

const EmployeeTalkChat = dynamic(
  () =>
    import("@/features/runtime-session/components/employee-talk-chat").then(
      (module) => module.EmployeeTalkChat,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-48 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-white/50" />
      </div>
    ),
  },
);

export function ConversationsChatPane({
  employee,
  threadId,
  brainModelLabel,
  departmentLabel,
  viewerName,
  viewerImage,
  detailsOpen,
  onToggleDetails,
}: {
  employee: ConversationEmployee;
  threadId: string | null;
  brainModelLabel: string | null;
  departmentLabel: string | null;
  viewerName: string;
  viewerImage: string | null;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black">
      <NullxesConversationHeader
        employeeId={employee.id}
        name={employee.name}
        role={employee.role}
        departmentLabel={departmentLabel}
        avatarPreviewUrl={employee.avatarPreviewUrl}
        avatarReady={employee.avatarProvisioningStatus === "ready"}
        detailsOpen={detailsOpen}
        onToggleDetails={onToggleDetails}
        modelLabel={brainModelLabel}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EmployeeTalkChat
          key={`${employee.id}-${threadId ?? "main"}`}
          embedded
          surface="conversations"
          chatSession={null}
          employeeId={employee.id}
          employeeName={employee.name}
          threadId={threadId}
          brainModelLabel={brainModelLabel}
          isSessionLive={false}
          voiceMode="elevenlabs"
          viewerName={viewerName}
          viewerImage={viewerImage}
        />
      </div>
    </div>
  );
}
