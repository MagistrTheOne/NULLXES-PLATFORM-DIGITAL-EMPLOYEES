"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("conversations");

  return (
    <aside
      className={cn(
        "conversations-details-rail flex h-full min-h-0 flex-col border-l border-white/8 bg-[#0a0a0a]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-white/8 px-4 py-3">
        <p className="text-[10px] font-medium tracking-[0.16em] text-white/40 uppercase">
          {t("detailsTitle")}
        </p>
      </div>
      <TalkAgentDetailsPanel
        embedded
        details={details}
        departmentLabel={departmentLabel}
        showTitle={false}
      />
    </aside>
  );
}
