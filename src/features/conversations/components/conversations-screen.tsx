"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import type { EmployeeListItem } from "@/features/employees/types";
import { TalkAnamProvider } from "@/features/runtime-session/context/talk-anam-context";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import type { TalkViewer } from "@/features/runtime-session/components/talk-viewer-card";
import { ConversationsChatPane } from "./conversations-chat-pane";
import { ConversationsDetailsRail } from "./conversations-details-rail";
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
    <div className="conversations-screen flex min-h-[min(88dvh,920px)] flex-col gap-5">
      <div className="conversations-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 shrink-0">
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-white/55">{t("subtitle")}</p>
        </div>
        <ConversationsToolbar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onNewConversation={handleNewConversation}
        />
      </div>

      <div className="conversations-workspace grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
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
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
              <p className="max-w-sm text-sm text-white/45">{t("pickEmployee")}</p>
            </div>
          )}
        </div>

        {selected && resolvedDetails ? (
          <ConversationsDetailsRail
            className="hidden xl:flex"
            details={resolvedDetails}
            departmentLabel={departmentLabel}
          />
        ) : null}

        {selected && resolvedDetails && mobileDetailsOpen ? (
          <div className="absolute inset-0 z-20 flex lg:hidden">
            <button
              type="button"
              className="flex-1 bg-black/60"
              onClick={() => setMobileDetailsOpen(false)}
              aria-label={t("closeDetails")}
            />
            <div className="w-[min(100%,320px)]">
              <ConversationsDetailsRail
                details={resolvedDetails}
                departmentLabel={departmentLabel}
                className="h-full shadow-2xl"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile inbox strip */}
      <div className="max-h-40 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:hidden">
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
  );
}
