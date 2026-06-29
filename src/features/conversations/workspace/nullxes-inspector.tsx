"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, UserRound, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "../components/conversation-avatar";
import {
  EmployeePresenceActivity,
  EmployeePresenceBadge,
} from "../components/employee-presence";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-2 text-xs">
      <span className="font-normal tracking-[0.08em] text-white/40 uppercase">
        {label}
      </span>
      <span className="max-w-40 truncate text-right font-medium text-white/85">
        {value}
      </span>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
}) {
  const className = cn(
    "flex h-10 flex-1 items-center justify-center rounded-lg border transition-colors",
    active
      ? "border-white/20 bg-white/8 text-white"
      : "border-white/8 bg-white/2 text-white/55 hover:bg-white/5 hover:text-white",
  );

  const content = (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} aria-label={label} className={className}>
            {icon}
          </Link>
        ) : (
          <span aria-current="true" aria-label={label} className={className}>
            {icon}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return content;
}

function formatActivityTime(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export function NullxesInspector({
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
  const tActions = useTranslations("conversations.actions");

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-transparent",
        className,
      )}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-8 p-6">
          <div className="flex flex-col gap-5">
            <ConversationAvatar
              name={details.name}
              previewUrl={details.avatarPreviewUrl}
              ready={details.avatarReady}
              online={details.online}
              size="lg"
            />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="truncate text-sm font-medium text-white">
                {details.name}
              </p>
              <EmployeePresenceBadge
                employeeId={details.employeeId}
                online={details.online}
                className="text-xs font-normal text-white/45"
                labelClassName="text-white/55"
              />
              <EmployeePresenceActivity
                employeeId={details.employeeId}
                online={details.online}
              />
              {departmentLabel ? (
                <p className="text-xs font-normal text-white/45">
                  {departmentLabel}
                </p>
              ) : null}
              <p className="truncate text-xs font-normal text-white/45">
                {details.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <QuickAction
              icon={<MessageSquare className="size-4 stroke-[1.5]" />}
              label={tActions("chat")}
              active
            />
            <QuickAction
              icon={<Video className="size-4 stroke-[1.5]" />}
              label={tActions("talk")}
              href={`/dashboard/employees/${details.employeeId}/talk`}
            />
            <QuickAction
              icon={<UserRound className="size-4 stroke-[1.5]" />}
              label={tActions("profile")}
              href={`/dashboard/employees/${details.employeeId}`}
            />
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-normal text-white/45">
              {details.currentTaskTitle ?? tPanel("currentTaskNone")}
            </p>
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-1">
            <MetaRow label={tPanel("model")} value={details.modelLabel ?? "—"} />
            <MetaRow label={tPanel("language")} value={details.language} />
          </div>

          <Separator className="bg-white/8" />

          <div className="flex flex-col gap-1">
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
              <ul className="flex flex-col gap-4">
                {[...details.activity].reverse().map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-xs"
                  >
                    <span className="truncate font-normal text-white/70">
                      {tPanel(`activityKind.${item.kind}`)}
                    </span>
                    <time className="shrink-0 text-[10px] tabular-nums text-white/35">
                      {formatActivityTime(item.at)}
                    </time>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/8 p-4">
        <Button
          variant="outline"
          className="h-10 w-full justify-between border-white/8 bg-transparent text-sm font-normal text-white hover:bg-white/4"
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
