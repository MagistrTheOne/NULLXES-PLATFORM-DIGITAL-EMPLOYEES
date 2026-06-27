"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRightLeft,
  Focus,
  MicOff,
  NotebookPen,
  PhoneOff,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TalkSessionControlsProps = {
  onNotes: () => void;
  onEndSession: () => void;
  onFocusMode: () => void;
  focusMode: boolean;
  disabled?: boolean;
  className?: string;
};

export function TalkSessionControls({
  onNotes,
  onEndSession,
  onFocusMode,
  focusMode,
  disabled = false,
  className,
}: TalkSessionControlsProps) {
  const t = useTranslations("employees.talk.sessionControls");

  const items: Array<{
    key: string;
    label: string;
    icon: typeof ArrowRightLeft;
    onClick?: () => void;
    stub: boolean;
    destructive?: boolean;
    active?: boolean;
  }> = [
    {
      key: "transfer",
      label: t("transfer"),
      icon: ArrowRightLeft,
      onClick: undefined,
      stub: true,
    },
    {
      key: "invite",
      label: t("invite"),
      icon: UserPlus,
      onClick: undefined,
      stub: true,
    },
    {
      key: "notes",
      label: t("notes"),
      icon: NotebookPen,
      onClick: onNotes,
      stub: false,
    },
    {
      key: "muteAgent",
      label: t("muteAgent"),
      icon: MicOff,
      onClick: undefined,
      stub: true,
    },
    {
      key: "focus",
      label: focusMode ? t("exitFocus") : t("focusMode"),
      icon: Focus,
      onClick: onFocusMode,
      stub: false,
      active: focusMode,
    },
    {
      key: "end",
      label: t("endSession"),
      icon: PhoneOff,
      onClick: onEndSession,
      stub: false,
      destructive: true,
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] tracking-[0.14em] text-white/45 uppercase">
        {t("title")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isDisabled = disabled || item.stub;

          return (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDisabled && item.key !== "end"}
              onClick={item.onClick}
              className={cn(
                "h-auto min-h-10 flex-col gap-1 rounded-xl border border-white/8 bg-white/[0.02] px-2 py-2 text-[10px] font-normal tracking-wide text-white/75 uppercase hover:bg-white/[0.05]",
                item.destructive &&
                  "border-white/15 text-white hover:bg-white/10 hover:text-white",
                item.active && "bg-white/10 text-white",
                isDisabled &&
                  item.key !== "end" &&
                  "cursor-not-allowed opacity-45",
              )}
            >
              <Icon className="size-3.5 stroke-[1.5]" aria-hidden />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
