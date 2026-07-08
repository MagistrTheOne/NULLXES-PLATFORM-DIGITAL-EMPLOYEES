"use client";

import { useState } from "react";
import { AudioLines } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { XaiVoiceCallSheet } from "@/features/xai-voice/components/xai-voice-call-sheet";

export function EmployeeGrokVoiceButton({
  employeeId,
  employeeName,
  avatarPreviewUrl,
}: {
  employeeId: string;
  employeeName: string;
  avatarPreviewUrl: string | null;
}) {
  const t = useTranslations("common.actions");
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-white/12 bg-transparent text-white hover:bg-white/5"
        onClick={() => setVoiceSheetOpen(true)}
      >
        <AudioLines className="mr-2 size-4" />
        {t("voice")}
      </Button>

      <XaiVoiceCallSheet
        open={voiceSheetOpen}
        onOpenChange={setVoiceSheetOpen}
        employeeId={employeeId}
        employeeName={employeeName}
        avatarPreviewUrl={avatarPreviewUrl}
        translationNamespace="employees.talk.xaiVoice"
      />
    </>
  );
}
