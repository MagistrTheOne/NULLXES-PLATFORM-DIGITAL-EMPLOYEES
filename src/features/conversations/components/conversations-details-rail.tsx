"use client";

import { TalkAgentDetailsPanel } from "@/features/runtime-session/components/talk-agent-details";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import { cn } from "@/lib/utils";

export function ConversationsDetailsRail({
  details,
  departmentLabel,
  className,
}: {
  details: TalkAgentDetails;
  departmentLabel: string | null;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "conversations-details-rail flex h-full min-h-0 flex-col border-l border-white/8 bg-[#0a0a0a]",
        className,
      )}
    >
      <TalkAgentDetailsPanel
        embedded
        details={details}
        departmentLabel={departmentLabel}
        showTitle={false}
      />
    </aside>
  );
}
