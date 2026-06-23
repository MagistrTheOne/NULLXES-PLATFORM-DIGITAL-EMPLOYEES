"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeTalkSessionAction } from "../actions/employee-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
import {
  EmployeeTalkRoom,
  type ActiveTalkSession,
  type EmployeeTalkSessionInputProps,
} from "./employee-talk-room";
import { TalkSessionMeta } from "./talk-session-meta";
import { useTalkSessionLifecycle } from "../lib/use-talk-session-lifecycle";
import { TalkSessionRatingDialog } from "./talk-session-rating-dialog";

type PendingSessionEnd = {
  sessionId: string;
  afterComplete: "stay" | "leave";
};

function TalkSessionShell({
  employeeName,
  sessionLimitSeconds,
  ...roomProps
}: EmployeeTalkSessionInputProps & { employeeName: string }) {
  const t = useTranslations("employees.talk");
  const tCommon = useTranslations("common.actions");
  const router = useRouter();
  const { stopSession } = useTalkAnam();
  const [activeSession, setActiveSession] = useState<ActiveTalkSession | null>(
    null,
  );
  const [pendingEnd, setPendingEnd] = useState<PendingSessionEnd | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLimitLeaving, setIsLimitLeaving] = useState(false);
  const limitHandledRef = useRef(false);
  const skipAbandonRef = useRef(false);

  useEffect(() => {
    if (activeSession) {
      skipAbandonRef.current = false;
    }
  }, [activeSession?.sessionId]);

  useTalkSessionLifecycle(activeSession?.sessionId ?? null, skipAbandonRef);

  const finalizeSession = useCallback(
    async (sessionId: string, afterComplete: PendingSessionEnd["afterComplete"], rating?: number) => {
      setIsEndingSession(true);
      try {
        await completeTalkSessionAction(sessionId, rating);
        setPendingEnd(null);
        setActiveSession(null);

        if (afterComplete === "leave") {
          router.push("/dashboard/employees");
        }
      } finally {
        setIsEndingSession(false);
      }
    },
    [router],
  );

  const beginSessionEnd = useCallback(
    async (session: ActiveTalkSession, afterComplete: PendingSessionEnd["afterComplete"]) => {
      skipAbandonRef.current = true;
      await stopSession();
      setActiveSession(null);
      setPendingEnd({ sessionId: session.sessionId, afterComplete });
    },
    [stopSession],
  );

  const handleStopSession = useCallback(async () => {
    if (!activeSession || isEndingSession) {
      return;
    }

    await beginSessionEnd(activeSession, "stay");
  }, [activeSession, beginSessionEnd, isEndingSession]);

  const handleLeaveSession = useCallback(async () => {
    if (isEndingSession || isLimitLeaving) {
      return;
    }

    if (activeSession) {
      await beginSessionEnd(activeSession, "leave");
      return;
    }

    router.push("/dashboard/employees");
  }, [activeSession, beginSessionEnd, isEndingSession, isLimitLeaving, router]);

  const handleSessionLimitReached = useCallback(async () => {
    if (limitHandledRef.current || isLimitLeaving || !activeSession) {
      return;
    }

    limitHandledRef.current = true;
    setIsLimitLeaving(true);
    try {
      await beginSessionEnd(activeSession, "leave");
    } finally {
      setIsLimitLeaving(false);
    }
  }, [activeSession, beginSessionEnd, isLimitLeaving]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row">
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
          {...roomProps}
          employeeName={employeeName}
          sessionLimitSeconds={sessionLimitSeconds}
          activeSession={activeSession}
          onActiveSessionChange={setActiveSession}
          onStopSession={handleStopSession}
          onLeaveSession={handleLeaveSession}
          sessionBusy={isEndingSession || isLimitLeaving || Boolean(pendingEnd)}
        />
      </div>

      <TalkSessionRatingDialog
        open={pendingEnd !== null}
        employeeName={employeeName}
        isSubmitting={isEndingSession}
        onSubmit={(rating) => {
          if (!pendingEnd) {
            return;
          }

          void finalizeSession(
            pendingEnd.sessionId,
            pendingEnd.afterComplete,
            rating,
          );
        }}
        onSkip={() => {
          if (!pendingEnd) {
            return;
          }

          void finalizeSession(pendingEnd.sessionId, pendingEnd.afterComplete);
        }}
      />
    </>
  );
}

export function EmployeeTalkSession({
  employeeName,
  ...roomProps
}: EmployeeTalkSessionInputProps & { employeeName: string }) {
  return (
    <TalkAnamProvider>
      <TalkSessionShell employeeName={employeeName} {...roomProps} />
    </TalkAnamProvider>
  );
}
