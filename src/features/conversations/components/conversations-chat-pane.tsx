"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Info,
  Loader2,
  MoreHorizontal,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "./conversation-avatar";
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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-[#0a0a0a]">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/8 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <ConversationAvatar
            name={employee.name}
            previewUrl={employee.avatarPreviewUrl}
            ready={employee.avatarProvisioningStatus === "ready"}
            online
            size="default"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {employee.name}
            </p>
            <p className="flex items-center gap-2 truncate text-xs font-normal text-white/45">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
              {t("online")} · {employee.role}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-9 text-white/45 hover:bg-white/[0.04] hover:text-white"
                asChild
              >
                <Link
                  href={`/dashboard/employees/${employee.id}/talk`}
                  aria-label={t("openTalk")}
                >
                  <Video className="size-4 stroke-[1.5]" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("openTalk")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onToggleDetails}
                className={cn(
                  "size-9 hover:bg-white/[0.04] hover:text-white xl:hidden",
                  detailsOpen ? "bg-white/[0.06] text-white" : "text-white/45",
                )}
                aria-label={t("toggleDetails")}
              >
                <Info className="size-4 stroke-[1.5]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("toggleDetails")}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-9 text-white/45 hover:bg-white/[0.04] hover:text-white"
                aria-label={t("more")}
              >
                <MoreHorizontal className="size-4 stroke-[1.5]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/8 bg-[#111111]">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/employees/${employee.id}`}>
                  {t("openProfile")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="employee-talk-chat-panel conversations-chat-body flex min-h-0 flex-1 flex-col">
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
