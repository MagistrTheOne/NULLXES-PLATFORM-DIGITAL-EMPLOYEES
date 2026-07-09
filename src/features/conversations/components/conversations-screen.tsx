"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { ConversationsChatPane } from "./conversations-chat-pane";
import { ConversationsInspector } from "./conversations-inspector";
import {
  ConversationsInbox,
  useConversationsThreads,
} from "./conversations-inbox";
import {
  ConversationsToolbar,
  type ConversationsFilterState,
} from "./conversations-toolbar";
import "./conversations-theme.css";
import "@/features/runtime-session/components/employee-talk-theme.css";
import { connectTalkChatSessionAction } from "@/features/runtime-session/actions/connect-talk-chat-session";

const DETAILS_STORAGE_KEY = "nullxes:conversations-details-open";

function readStoredDetailsOpen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(DETAILS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export type ConversationEmployee = Pick<
  EmployeeListItem,
  "id" | "name" | "role" | "department" | "avatarPreviewUrl" | "avatarProvisioningStatus" | "canTalk"
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [threadsVersion, setThreadsVersion] = useState(0);

  const [conversationFilter, setConversationFilter] = useState<ConversationsFilterState>({
    departments: [],
    employeeIds: [],
    onlyReady: false,
  });

  useEffect(() => {
    setDetailsOpen(readStoredDetailsOpen());
  }, []);

  function handleToggleDetails(): void {
    setDetailsOpen((open) => {
      const next = !open;
      try {
        window.localStorage.setItem(DETAILS_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const talkReady = employees.filter((employee) => employee.canTalk);

  const filteredForList = useMemo(() => {
    let list = talkReady;

    const { departments, employeeIds, onlyReady } = conversationFilter;

    // Explicit employee selection takes precedence (user picked specific ones)
    if (employeeIds.length > 0) {
      list = list.filter((e) => employeeIds.includes(e.id));
    }

    if (departments.length > 0) {
      list = list.filter((e) => e.department && departments.includes(e.department));
    }

    if (onlyReady) {
      list = list.filter((e) => e.avatarProvisioningStatus === "ready");
    }

    return list;
  }, [conversationFilter, talkReady]);

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
    const threadId = createThread();
    // Sync/create the thread channel in Stream (and any related metadata).
    // Fire-and-forget so the UI feels instant; the chat connect will also ensure it.
    void connectTalkChatSessionAction(selected.id, threadId).catch(() => undefined);
    // Bump to force the inbox to re-fetch threads list (for real sync from Stream)
    setThreadsVersion((v) => v + 1);
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Fill the dashboard viewport on 27"+ so the page itself does not scroll;
          the inbox / message list / inspector scroll inside their panes. */}
      <div className="conversations-screen flex h-[calc(100svh-6.5rem)] min-h-[520px] flex-col gap-5 sm:gap-6 min-[1800px]:h-[calc(100svh-5.5rem)]">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-medium tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-sm font-normal text-white/55">
              {t("subtitle")}
            </p>
          </div>
          <ConversationsToolbar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onNewConversation={handleNewConversation}
            filter={conversationFilter}
            onFilterChange={setConversationFilter}
            filterCount={`${filteredForList.length}/${talkReady.length}`}
            allEmployees={talkReady}
          />
        </div>

        <div
          className={cn(
            "conversations-workspace grid min-h-0 flex-1 overflow-hidden rounded-2xl lg:grid-cols-[280px_minmax(0,1fr)]",
            detailsOpen
              ? "xl:grid-cols-[300px_minmax(0,1fr)_320px] 2xl:grid-cols-[320px_minmax(0,1fr)_340px] min-[1800px]:grid-cols-[340px_minmax(0,1fr)_360px]"
              : "xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)] min-[1800px]:grid-cols-[340px_minmax(0,1fr)]",
          )}
        >
          <ConversationsInbox
            className="hidden lg:flex"
            employees={filteredForList}
            selectedEmployee={selected}
            activeThreadId={activeThreadId}
            onSelectEmployee={handleSelectEmployee}
            onSelectThread={selectThread}
            searchQuery={searchQuery}
            threadsVersion={threadsVersion}
          />

          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            {selected ? (
              <TalkAnamProvider>
                <ConversationsChatPane
                  employee={selected}
                  threadId={activeThreadId}
                  brainModelLabel={brainModelLabel}
                  departmentLabel={departmentLabel}
                  viewerName={viewer.name}
                  viewerImage={viewer.image}
                  detailsOpen={detailsOpen || mobileDetailsOpen}
                  onToggleDetails={() => {
                    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches) {
                      handleToggleDetails();
                      return;
                    }
                    setMobileDetailsOpen((value) => !value);
                  }}
                />
              </TalkAnamProvider>
            ) : (
              <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
                <p className="max-w-sm text-sm font-normal text-white/45">
                  {t("pickEmployee")}
                </p>
              </div>
            )}
          </div>

          {selected && resolvedDetails && detailsOpen ? (
            <div className="hidden min-h-0 border-l border-white/6 xl:flex">
              <ConversationsInspector
                className="w-full max-w-[340px]"
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

        <div className="max-h-40 shrink-0 overflow-hidden border border-white/8 bg-[#0a0a0a] lg:hidden">
          <ConversationsInbox
            employees={filteredForList}
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
