"use client";

import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import { NullxesInspector } from "@/features/conversations/workspace";
import { cn } from "@/lib/utils";

export function ConversationsInspector({
  details,
  departmentLabel,
  className,
}: {
  details: TalkAgentDetails;
  departmentLabel: string | null;
  className?: string;
}) {
  return (
    <NullxesInspector
      details={details}
      departmentLabel={departmentLabel}
      className={cn("border-l border-white/8", className)}
    />
  );
}
