"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function EmployeeSystemInternals({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("employees.detail");
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("border-t border-white/10", className)}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm text-white/55 transition-colors hover:text-white/80">
        <span>
          <span className="font-medium text-white/70">{t("systemInternals")}</span>
          <span className="mt-0.5 block text-xs text-white/40">
            {t("systemInternalsHint")}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}
