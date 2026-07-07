"use client";

import { Loader2, Mic, MicOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useXaiVoiceSession } from "@/features/xai-voice/hooks/use-xai-voice-session";

export function XaiVoiceCallSheet({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  sessionId,
  translationNamespace = "conversations.xaiVoice",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  sessionId?: string;
  translationNamespace?: string;
}) {
  const t = useTranslations(translationNamespace);
  const { state, error, transcript, start, stop, isLive } = useXaiVoiceSession({
    employeeId,
    sessionId,
    enabled: open,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      stop();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="border-white/10 bg-[#0a0a0a] text-white"
      >
        <SheetHeader>
          <SheetTitle>{t("title", { name: employeeName })}</SheetTitle>
          <SheetDescription className="text-white/55">
            {t("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="bg-white text-black hover:bg-white/90"
              disabled={state === "connecting"}
              onClick={() => void (isLive ? stop() : start())}
            >
              {state === "connecting" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("connecting")}
                </>
              ) : isLive ? (
                <>
                  <MicOff className="mr-2 size-4" />
                  {t("endCall")}
                </>
              ) : (
                <>
                  <Mic className="mr-2 size-4" />
                  {t("startCall")}
                </>
              )}
            </Button>
            <span className="text-sm text-white/50">
              {state === "live"
                ? t("statusLive")
                : state === "connecting"
                  ? t("statusConnecting")
                  : state === "error"
                    ? t("statusError")
                    : t("statusIdle")}
            </span>
          </div>

          {error ? (
            <p className="text-sm text-red-300/90" role="alert">
              {error}
            </p>
          ) : null}

          {transcript.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/75">
              {transcript.map((line, index) => (
                <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
