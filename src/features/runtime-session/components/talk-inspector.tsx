"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TalkAgentDetailsPanel,
  type TalkAgentDetails,
} from "./talk-agent-details";
import { TalkSessionsSidebar } from "./talk-sessions-sidebar";
import { TalkViewerCard, type TalkViewer } from "./talk-viewer-card";
import type { TalkThreadsController } from "../lib/use-talk-threads";

/**
 * Contextual layer for the Talk canvas. Instead of a permanent right column,
 * the agent profile, sessions and operator identity slide in on demand.
 */
export function TalkInspector({
  open,
  onOpenChange,
  agentDetails,
  viewer,
  threads,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentDetails: TalkAgentDetails;
  viewer: TalkViewer;
  threads: TalkThreadsController;
}) {
  const t = useTranslations("employees.talk.inspector");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-white/10 bg-[#0B0B0B] p-0 text-white sm:max-w-md"
      >
        <SheetHeader className="shrink-0 gap-1 border-b border-white/8 p-4 pe-12">
          <SheetTitle className="text-sm text-white">{t("title")}</SheetTitle>
          <SheetDescription className="text-xs text-white/45">
            {t("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="h-[clamp(140px,28vh,260px)] shrink-0 border-b border-white/8">
            <TalkSessionsSidebar
              embedded
              threads={threads.threads}
              activeThreadId={threads.activeThreadId}
              loading={threads.loading}
              onSelect={(id) => {
                threads.select(id);
                onOpenChange(false);
              }}
              onNew={() => {
                threads.createNew();
                onOpenChange(false);
              }}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TalkAgentDetailsPanel embedded details={agentDetails} />
          </div>

          <div className="shrink-0 border-t border-white/8 p-3">
            <TalkViewerCard viewer={viewer} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
