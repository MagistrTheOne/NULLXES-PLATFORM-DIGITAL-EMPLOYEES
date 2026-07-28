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

export function EmployeeKnowledgeCollapsible({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("employees.knowledge");
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-white/10 bg-[#111111] text-white"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/2">
        <div>
          <p className="text-base font-medium text-white">
            {t("collapsibleTitle", { count })}
          </p>
          <p className="mt-1 text-sm text-white/45">{t("collapsibleHint")}</p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-white/10 px-5 py-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
