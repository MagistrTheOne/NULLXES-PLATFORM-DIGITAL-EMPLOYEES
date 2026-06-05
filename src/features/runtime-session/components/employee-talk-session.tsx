"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeTalkSessionAction } from "../actions/employee-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
import {
  EmployeeTalkRoom,
  type EmployeeTalkRoomProps,
} from "./employee-talk-room";
import { TalkSessionMeta } from "./talk-session-meta";

function TalkSessionShell({
  employeeName,
  sessionLimitSeconds,
  employeeSessionId,
  ...roomProps
}: EmployeeTalkRoomProps & { employeeName: string }) {
  const t = useTranslations("employees.talk");
  const tCommon = useTranslations("common.actions");
  const router = useRouter();
  const { stopSession } = useTalkAnam();
  const [isLimitLeaving, setIsLimitLeaving] = useState(false);
  const limitHandledRef = useRef(false);

  const handleSessionLimitReached = useCallback(async () => {
    if (limitHandledRef.current || isLimitLeaving) {
      return;
    }
    limitHandledRef.current = true;
    setIsLimitLeaving(true);
    try {
      await stopSession();
      await completeTalkSessionAction(employeeSessionId);
    } finally {
      router.push("/dashboard/employees");
    }
  }, [employeeSessionId, isLimitLeaving, router, stopSession]);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            className="shrink-0 text-white/60 hover:bg-white/5 hover:text-white"
            asChild
          >
            <Link href="/dashboard/employees">
              <ArrowLeft className="size-4" />
              {tCommon("back")}
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-tight text-white">
              {t("title", { name: employeeName })}
            </h1>
            <p className="mt-1 text-sm text-white/60">{t("subtitle")}</p>
          </div>
        </div>
        <TalkSessionMeta
          sessionLimitSeconds={sessionLimitSeconds}
          onLimitReached={() => {
            void handleSessionLimitReached();
          }}
        />
      </div>
      <EmployeeTalkRoom
        employeeName={employeeName}
        employeeSessionId={employeeSessionId}
        sessionLimitSeconds={sessionLimitSeconds}
        {...roomProps}
      />
    </div>
  );
}

export function EmployeeTalkSession({
  employeeName,
  ...roomProps
}: EmployeeTalkRoomProps & { employeeName: string }) {
  return (
    <TalkAnamProvider>
      <TalkSessionShell employeeName={employeeName} {...roomProps} />
    </TalkAnamProvider>
  );
}
