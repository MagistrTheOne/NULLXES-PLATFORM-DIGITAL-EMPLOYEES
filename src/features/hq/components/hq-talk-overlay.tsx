"use client";

import "@/features/runtime-session/components/employee-talk-theme.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TalkAnamProvider } from "@/features/runtime-session/context/talk-anam-context";
import { TalkChatWorkspace } from "@/features/runtime-session/components/talk-chat-workspace";
import { useOfficeStore } from "../store/use-office-store";
import type { HqEmployee } from "../types";

/**
 * Inline office chat from HQ: sessions + chat in a wide sheet. Full agent
 * panel lives on /dashboard/conversations or /talk.
 */
export function HqTalkOverlay({ employees }: { employees: HqEmployee[] }) {
  const t = useTranslations("hq.talk");
  const talkEmployeeId = useOfficeStore((state) => state.talkEmployeeId);
  const closeTalk = useOfficeStore((state) => state.closeTalk);

  const employee = employees.find((item) => item.id === talkEmployeeId) ?? null;
  const open = employee !== null && employee.canTalk;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          closeTalk();
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-white/10 bg-[#0B0B0B] p-0 text-white sm:max-w-2xl lg:max-w-4xl"
      >
        {employee ? (
          <>
            <SheetHeader className="shrink-0 gap-1 border-b border-white/10 p-4 pe-12">
              <SheetTitle className="text-sm text-white">
                {employee.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-white/45">
                {employee.role}
              </SheetDescription>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link
                  href={`/dashboard/conversations?employee=${employee.id}`}
                  className="inline-flex w-fit items-center gap-1 text-[11px] text-white/55 transition-colors hover:text-white"
                >
                  {t("openFull")}
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <TalkAnamProvider>
                <TalkChatWorkspace
                  employeeId={employee.id}
                  employeeName={employee.name}
                  chatSession={null}
                  isSessionLive={false}
                  voiceMode="elevenlabs"
                  variant="compact"
                  className="min-h-0 flex-1"
                />
              </TalkAnamProvider>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
