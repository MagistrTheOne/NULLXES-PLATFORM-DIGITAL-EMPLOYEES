"use client";

import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import { cn } from "@/lib/utils";
import { ConversationsInspector } from "./conversations-inspector";

/** @deprecated Use ConversationsInspector directly */
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
    <ConversationsInspector
      details={details}
      departmentLabel={departmentLabel}
      className={cn("border-l border-white/8", className)}
    />
  );
}
