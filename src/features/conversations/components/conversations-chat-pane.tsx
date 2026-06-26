"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Info,
  Loader2,
  MoreHorizontal,
  UserRound,
  Video,
} from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { cn } from "@/lib/utils";
import type { ConversationEmployee } from "./conversations-screen";

const EmployeeTalkChat = dynamic(
  () =>
    import("@/features/runtime-session/components/employee-talk-chat").then(
      (module) => module.EmployeeTalkChat,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="employee-talk-chat-fallback flex h-full items-center justify-center">
        <Loader2 className="size-4 animate-spin text-white/50" />
      </div>
    ),
  },
);

export function ConversationsChatPane({
  employee,
  threadId,
  brainModelLabel,
  viewerName,
  viewerImage,
  detailsOpen,
  onToggleDetails,
}: {
  employee: ConversationEmployee;
  threadId: string | null;
  brainModelLabel: string | null;
  viewerName: string;
  viewerImage: string | null;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const t = useTranslations("conversations");

  return (
    <div className="conversations-chat-pane flex h-full min-h-0 min-w-0 flex-col bg-[#0a0a0a]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black">
            {employee.avatarPreviewUrl &&
            employee.avatarProvisioningStatus === "ready" ? (
              <AvatarIdlePreview
                src={employee.avatarPreviewUrl}
                alt={employee.name}
                sizes="36px"
              />
            ) : (
              <UserRound className="size-4 text-white/40" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#0a0a0a] bg-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {employee.name}
            </p>
            <p className="flex items-center gap-1.5 truncate text-[11px] text-white/45">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
              {t("online")} · {employee.role}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/dashboard/employees/${employee.id}/talk`}
            className="flex size-8 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/6 hover:text-white"
            aria-label={t("openTalk")}
          >
            <Video className="size-4 stroke-[1.5]" />
          </Link>
          <button
            type="button"
            onClick={onToggleDetails}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/6 hover:text-white lg:hidden",
              detailsOpen ? "bg-white/8 text-white" : "text-white/45",
            )}
            aria-label={t("toggleDetails")}
          >
            <Info className="size-4 stroke-[1.5]" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/6 hover:text-white"
            aria-label={t("more")}
          >
            <MoreHorizontal className="size-4 stroke-[1.5]" />
          </button>
        </div>
      </header>

      <div className="employee-talk-chat-panel conversations-chat-body flex min-h-0 flex-1 flex-col overflow-hidden">
        <EmployeeTalkChat
          key={`${employee.id}-${threadId ?? "main"}`}
          embedded
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

      <p className="shrink-0 border-t border-white/8 px-4 py-2 text-center text-[10px] text-white/30">
        {t("composerHint")}
      </p>
    </div>
  );
}
