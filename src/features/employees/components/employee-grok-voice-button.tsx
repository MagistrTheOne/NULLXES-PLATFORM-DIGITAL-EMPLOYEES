"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { XaiVoiceCallSheet } from "@/features/xai-voice/components/xai-voice-call-sheet";

export function EmployeeGrokVoiceButton({
  employeeId,
  employeeName,
  avatarPreviewUrl,
  disabled = false,
}: {
  employeeId: string;
  employeeName: string;
  avatarPreviewUrl: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("common.actions");
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="border-white/12 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
        onClick={() => setVoiceSheetOpen(true)}
      >
        <Phone className="mr-2 size-4" />
        {t("quickCall")}
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
