"use client";

import { useTranslations } from "next-intl";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConversationsToolbar({
  query,
  onQueryChange,
  onNewConversation,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onNewConversation: () => void;
}) {
  const t = useTranslations("conversations");

  return (
    <div className="conversations-toolbar flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
      <div className="conversations-search relative w-full sm:w-[280px]">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 rounded-xl border-white/10 bg-white/[0.04] pr-14 pl-10 text-sm text-white shadow-none transition-colors placeholder:text-white/35 focus-visible:border-white/16 focus-visible:bg-white/[0.06] focus-visible:ring-0"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/35 sm:inline">
          ⌘K
        </kbd>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.07] hover:text-white"
        >
          <Filter className="size-4" />
        </Button>
        <Button
          type="button"
          className="h-10 shrink-0 gap-1.5 rounded-xl px-3.5 text-xs font-medium"
          onClick={onNewConversation}
        >
          <Plus className="size-4" />
          {t("newConversation")}
        </Button>
      </div>
    </div>
  );
}
