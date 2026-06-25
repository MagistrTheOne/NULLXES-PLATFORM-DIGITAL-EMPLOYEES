"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageSquare, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import type { EmployeeListItem } from "@/features/employees/types";
import { TalkAnamProvider } from "@/features/runtime-session/context/talk-anam-context";
import { TalkChatWorkspace } from "@/features/runtime-session/components/talk-chat-workspace";
import type { TalkAgentDetails } from "@/features/runtime-session/components/talk-agent-details";

export type ConversationEmployee = Pick<
  EmployeeListItem,
  "id" | "name" | "role" | "avatarPreviewUrl" | "avatarProvisioningStatus" | "canTalk"
>;

export function ConversationsScreen({
  employees,
  selectedEmployeeId,
  agentDetails,
  brainModelLabel,
}: {
  employees: ConversationEmployee[];
  selectedEmployeeId: string | null;
  agentDetails: TalkAgentDetails | null;
  brainModelLabel: string | null;
}) {
  const t = useTranslations("conversations");
  const talkReady = employees.filter((employee) => employee.canTalk);
  const selected =
    talkReady.find((employee) => employee.id === selectedEmployeeId) ??
    talkReady[0] ??
    null;

  const resolvedDetails =
    agentDetails && selected && agentDetails.employeeId === selected.id
      ? { ...agentDetails, modelLabel: brainModelLabel }
      : agentDetails;

  return (
    <div className="flex min-h-[min(72dvh,760px)] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-white/55">{t("subtitle")}</p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-[#0a0a0a]">
          <div className="border-b border-white/10 px-3 py-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
              {t("roster")}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
            {talkReady.map((employee) => {
              const active = employee.id === selected?.id;
              return (
                <Link
                  key={employee.id}
                  href={`/dashboard/conversations?employee=${employee.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                    active ? "bg-white/8" : "hover:bg-white/4",
                  )}
                >
                  <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
                    {employee.avatarPreviewUrl &&
                    employee.avatarProvisioningStatus === "ready" ? (
                      <AvatarIdlePreview
                        src={employee.avatarPreviewUrl}
                        alt={employee.name}
                        sizes="36px"
                      />
                    ) : (
                      <UserRound className="size-4 text-white/40" />
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-black bg-emerald-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-white">
                      {employee.name}
                    </span>
                    <span className="block truncate text-[10px] text-white/40">
                      {employee.role}
                    </span>
                  </span>
                </Link>
              );
            })}
            {talkReady.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-white/40">
                {t("emptyRoster")}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          {selected && resolvedDetails ? (
            <TalkAnamProvider>
              <TalkChatWorkspace
                employeeId={selected.id}
                employeeName={selected.name}
                chatSession={null}
                brainModelLabel={brainModelLabel}
                agentDetails={resolvedDetails}
                variant="full"
                className="min-h-[min(64dvh,680px)]"
              />
            </TalkAnamProvider>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-6 text-center">
              <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
              <p className="max-w-sm text-sm text-white/45">{t("pickEmployee")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
