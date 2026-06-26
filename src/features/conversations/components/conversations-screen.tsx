"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { EmployeeListItem } from "@/features/employees/types";
import { TalkAnamProvider } from "@/features/runtime-session/context/talk-anam-context";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import type { TalkViewer } from "@/features/runtime-session/components/talk-viewer-card";
import { ConversationsChatPane } from "./conversations-chat-pane";
import { ConversationsInspector } from "./conversations-inspector";
import {
  ConversationsInbox,
  useConversationsThreads,
} from "./conversations-inbox";
import { ConversationsToolbar } from "./conversations-toolbar";
import "./conversations-theme.css";
import "@/features/runtime-session/components/employee-talk-theme.css";

export type ConversationEmployee = Pick<
  EmployeeListItem,
  "id" | "name" | "role" | "avatarPreviewUrl" | "avatarProvisioningStatus" | "canTalk"
>;

export function ConversationsScreen({
  employees,
  selectedEmployeeId,
  agentDetails,
  brainModelLabel,
  viewer,
  departmentLabel,
}: {
  employees: ConversationEmployee[];
  selectedEmployeeId: string | null;
  agentDetails: TalkAgentDetails | null;
  brainModelLabel: string | null;
  viewer: TalkViewer;
  departmentLabel: string | null;
}) {
  const t = useTranslations("conversations");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  const talkReady = employees.filter((employee) => employee.canTalk);
  const selected =
    talkReady.find((employee) => employee.id === selectedEmployeeId) ??
    talkReady[0] ??
    null;

  const { activeThreadId, selectThread, createThread } =
    useConversationsThreads(selected?.id ?? null);

  const resolvedDetails =
    agentDetails && selected && agentDetails.employeeId === selected.id
      ? { ...agentDetails, modelLabel: brainModelLabel }
      : agentDetails;

  const handleSelectEmployee = (employeeId: string) => {
    router.push(`/dashboard/conversations?employee=${employeeId}`);
  };

  const handleNewConversation = () => {
    if (!selected) {
      return;
    }
    createThread();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="conversations-screen flex min-h-[min(88dvh,920px)] flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-medium tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm font-normal text-white/55">
              {t("subtitle")}
            </p>
          </div>
          <ConversationsToolbar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onNewConversation={handleNewConversation}
          />
        </div>

        <div className="conversations-workspace grid min-h-0 flex-1 overflow-hidden border border-white/8 bg-[#0a0a0a] lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <ConversationsInbox
            className="hidden lg:flex"
            employees={employees}
            selectedEmployee={selected}
            activeThreadId={activeThreadId}
            onSelectEmployee={handleSelectEmployee}
            onSelectThread={selectThread}
            searchQuery={searchQuery}
          />

          <div className="flex min-h-0 min-w-0 flex-col">
            {selected && resolvedDetails ? (
              <TalkAnamProvider>
                <ConversationsChatPane
                  employee={selected}
                  threadId={activeThreadId}
                  brainModelLabel={brainModelLabel}
                  viewerName={viewer.name}
                  viewerImage={viewer.image}
                  detailsOpen={mobileDetailsOpen}
                  onToggleDetails={() => setMobileDetailsOpen((value) => !value)}
                />
              </TalkAnamProvider>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
                <p className="max-w-sm text-sm font-normal text-white/45">
                  {t("pickEmployee")}
                </p>
              </div>
            )}
          </div>

          {selected && resolvedDetails ? (
            <div className="hidden min-h-0 border-l border-white/8 xl:flex">
              <ConversationsInspector
                className="w-[340px]"
                details={resolvedDetails}
                departmentLabel={departmentLabel}
              />
            </div>
          ) : null}
        </div>

        {selected && resolvedDetails ? (
          <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
            <SheetContent
              side="right"
              className="w-[min(100%,340px)] gap-0 border-white/8 bg-[#0a0a0a] p-0"
            >
              <ConversationsInspector
                details={resolvedDetails}
                departmentLabel={departmentLabel}
                className="h-full"
              />
            </SheetContent>
          </Sheet>
        ) : null}

        <div className="max-h-48 overflow-hidden border border-white/8 bg-[#0a0a0a] lg:hidden">
          <ConversationsInbox
            employees={employees}
            selectedEmployee={selected}
            activeThreadId={activeThreadId}
            onSelectEmployee={handleSelectEmployee}
            onSelectThread={selectThread}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
