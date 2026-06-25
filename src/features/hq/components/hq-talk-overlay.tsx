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
import { EmployeeTalkChat } from "@/features/runtime-session/components/employee-talk-chat";
import { TalkAnamProvider } from "@/features/runtime-session/context/talk-anam-context";
import { useOfficeStore } from "../store/use-office-store";
import type { HqEmployee } from "../types";

/**
 * Inline office chat: opens a side panel right on the HQ floor so the user can
 * talk to an employee without leaving the headquarters. Reuses the real talk
 * chat pipeline (Stream + brain) in text-only mode (no live avatar/voice).
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
        className="w-full gap-0 border-white/10 bg-[#0B0B0B] p-0 text-white sm:max-w-md"
      >
        {employee ? (
          <>
            <SheetHeader className="gap-1 border-b border-white/10 p-4 pe-12">
              <SheetTitle className="text-sm text-white">
                {employee.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-white/45">
                {employee.role}
              </SheetDescription>
              <Link
                href={`/dashboard/employees/${employee.id}/talk`}
                className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] text-white/55 transition-colors hover:text-white"
              >
                {t("openFull")}
                <ArrowUpRight className="size-3" />
              </Link>
            </SheetHeader>
            <div className="employee-talk-chat-panel relative flex min-h-0 flex-1 flex-col">
              <TalkAnamProvider>
                <EmployeeTalkChat
                  key={employee.id}
                  chatSession={null}
                  employeeId={employee.id}
                  isSessionLive={false}
                  voiceMode="elevenlabs"
                />
              </TalkAnamProvider>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
