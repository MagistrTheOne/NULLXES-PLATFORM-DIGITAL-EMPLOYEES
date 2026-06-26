"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "./conversation-avatar";

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
      {children}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-2 text-xs">
      <span className="font-normal text-white/45">{label}</span>
      <span className="max-w-[10rem] truncate text-right font-medium text-white/85">
        {value}
      </span>
    </div>
  );
}

function formatActivityTime(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

const ACTIVITY_DOT: Record<
  NonNullable<TalkAgentDetails["activity"]>[number]["kind"],
  string
> = {
  connected: "bg-white/35",
  session_started: "bg-white/35",
  session_ended: "bg-white/25",
  speaking: "bg-emerald-400",
};

export function ConversationsInspector({
  details,
  departmentLabel,
  className,
}: {
  details: TalkAgentDetails;
  departmentLabel: string | null;
  className?: string;
}) {
  const tPanel = useTranslations("employees.talk.agentPanel");
  const t = useTranslations("conversations");

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-[#0a0a0a]",
        className,
      )}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">
            <ConversationAvatar
              name={details.name}
              previewUrl={details.avatarPreviewUrl}
              ready={details.avatarReady}
              online={details.online}
              size="lg"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-sm font-medium text-white">
                {details.name}
              </p>
              <p className="flex items-center gap-2 text-xs font-normal text-white/45">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    details.online ? "bg-emerald-400" : "bg-white/30",
                  )}
                />
                {details.online ? tPanel("online") : tPanel("offline")}
              </p>
              <p className="truncate text-xs font-normal text-white/45">
                {details.role}
              </p>
            </div>
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-1">
            <MetaRow label={tPanel("model")} value={details.modelLabel ?? "—"} />
            <MetaRow label={tPanel("language")} value={details.language} />
            {departmentLabel ? (
              <MetaRow label={tPanel("department")} value={departmentLabel} />
            ) : null}
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-2">
            <SectionLabel>{tPanel("currentTask")}</SectionLabel>
            <p className="text-sm font-normal text-white/85">
              {details.currentTaskTitle ?? tPanel("currentTaskNone")}
            </p>
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-1">
            <SectionLabel>{tPanel("statistics")}</SectionLabel>
            <MetaRow
              label={tPanel("conversationsToday")}
              value={String(details.stats.conversationsToday)}
            />
            <MetaRow
              label={tPanel("talkTime")}
              value={formatDurationSeconds(details.stats.talkTimeSeconds)}
            />
            <MetaRow
              label={tPanel("satisfaction")}
              value={
                details.stats.satisfaction !== null
                  ? `${details.stats.satisfaction.toFixed(1)} / 5`
                  : "—"
              }
            />
          </div>

          {details.activity && details.activity.length > 0 ? (
            <>
              <Separator className="bg-white/8" />
              <div className="flex flex-col gap-3">
                <SectionLabel>{tPanel("activity")}</SectionLabel>
                <ul className="flex flex-col gap-3">
                  {[...details.activity].reverse().map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-xs"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 font-normal text-white/70">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            ACTIVITY_DOT[item.kind],
                          )}
                        />
                        <span className="truncate">
                          {tPanel(`activityKind.${item.kind}`)}
                        </span>
                      </span>
                      <time className="shrink-0 text-[10px] text-white/35 tabular-nums">
                        {formatActivityTime(item.at)}
                      </time>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/8 p-4">
        <Button
          variant="outline"
          className="h-10 w-full justify-between border-white/8 bg-transparent text-sm font-normal text-white hover:bg-white/[0.04]"
          asChild
        >
          <Link href={`/dashboard/employees/${details.employeeId}`}>
            {t("openProfile")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
