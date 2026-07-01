"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeTalkSessionAction } from "../actions/employee-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
import {
  EmployeeTalkRoom,
  type ActiveTalkSession,
  type EmployeeTalkSessionInputProps,
} from "./employee-talk-room";
import { useTalkSessionLifecycle } from "../lib/use-talk-session-lifecycle";
import { TalkSessionRatingDialog } from "./talk-session-rating-dialog";

type PendingSessionEnd = {
  sessionId: string;
  afterComplete: "stay" | "leave" | "debrief";
};

function TalkSessionShell({
  employeeName,
  sessionLimitSeconds,
  scenarioSessionId,
  employeeId,
  ...roomProps
}: EmployeeTalkSessionInputProps & {
  employeeName: string;
}) {
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
    async (
      sessionId: string,
      afterComplete: PendingSessionEnd["afterComplete"],
      rating?: number,
    ) => {
      setIsEndingSession(true);
      try {
        await completeTalkSessionAction(sessionId, rating);
        setPendingEnd(null);
        setActiveSession(null);

        if (afterComplete === "leave") {
          router.push("/dashboard/employees");
        } else if (afterComplete === "debrief" && scenarioSessionId) {
          router.push(
            `/dashboard/employees/${employeeId}/scenarios/${scenarioSessionId}/debrief`,
          );
        }
      } finally {
        setIsEndingSession(false);
      }
    },
    [router, scenarioSessionId, employeeId],
  );

  useEffect(() => {
    if (!scenarioSessionId || !pendingEnd || isEndingSession) {
      return;
    }

    void finalizeSession(pendingEnd.sessionId, pendingEnd.afterComplete);
  }, [
    finalizeSession,
    isEndingSession,
    pendingEnd,
    scenarioSessionId,
  ]);

  const beginSessionEnd = useCallback(
    async (
      session: ActiveTalkSession,
      afterComplete: PendingSessionEnd["afterComplete"],
    ) => {
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
    await beginSessionEnd(
      activeSession,
      scenarioSessionId ? "debrief" : "stay",
    );
  }, [activeSession, beginSessionEnd, isEndingSession, scenarioSessionId]);

  const handleLeaveSession = useCallback(async () => {
    if (isEndingSession || isLimitLeaving) {
      return;
    }

    if (activeSession) {
      await beginSessionEnd(
        activeSession,
        scenarioSessionId ? "debrief" : "leave",
      );
      return;
    }

    router.push("/dashboard/employees");
  }, [
    activeSession,
    beginSessionEnd,
    isEndingSession,
    isLimitLeaving,
    router,
    scenarioSessionId,
  ]);

  const handleSessionLimitReached = useCallback(async () => {
    if (limitHandledRef.current || isLimitLeaving || !activeSession) {
      return;
    }

    limitHandledRef.current = true;
    setIsLimitLeaving(true);
    try {
      await beginSessionEnd(
        activeSession,
        scenarioSessionId ? "debrief" : "leave",
      );
    } finally {
      setIsLimitLeaving(false);
    }
  }, [activeSession, beginSessionEnd, isLimitLeaving, scenarioSessionId]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        <EmployeeTalkRoom
          {...roomProps}
          employeeId={employeeId}
          scenarioSessionId={scenarioSessionId}
          employeeName={employeeName}
          sessionLimitSeconds={sessionLimitSeconds}
          activeSession={activeSession}
          onActiveSessionChange={setActiveSession}
          onStopSession={handleStopSession}
          onLeaveSession={handleLeaveSession}
          onSessionLimitReached={() => {
            void handleSessionLimitReached();
          }}
          sessionBusy={isEndingSession || isLimitLeaving || Boolean(pendingEnd)}
        />
      </div>

      <TalkSessionRatingDialog
        open={pendingEnd !== null && !scenarioSessionId}
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
