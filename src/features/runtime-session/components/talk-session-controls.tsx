"use client";

import { useTranslations } from "next-intl";
import { Focus, NotebookPen, PhoneOff } from "lucide-react";
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
    icon: typeof NotebookPen;
    onClick?: () => void;
    destructive?: boolean;
    active?: boolean;
  }> = [
    {
      key: "end",
      label: t("endSession"),
      icon: PhoneOff,
      onClick: onEndSession,
      destructive: true,
    },
    {
      key: "notes",
      label: t("notes"),
      icon: NotebookPen,
      onClick: onNotes,
    },
    {
      key: "focus",
      label: focusMode ? t("exitFocus") : t("focusMode"),
      icon: Focus,
      onClick: onFocusMode,
      active: focusMode,
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] tracking-[0.14em] text-white/45 uppercase">
        {t("title")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isDisabled = disabled && item.key !== "end";

          return (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={item.onClick}
              className={cn(
                "h-auto min-h-10 flex-col gap-1 rounded-xl border border-white/8 bg-white/2 px-2 py-2 text-[10px] font-normal tracking-wide text-white/75 uppercase hover:bg-white/5",
                item.destructive &&
                  "border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200",
                item.active && "bg-white/10 text-white",
                isDisabled && "cursor-not-allowed opacity-45",
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
