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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 border-white/10 bg-white/3 pl-9 text-sm text-white placeholder:text-white/35"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-white/10 bg-white/4 px-1.5 py-0.5 text-[10px] text-white/35 sm:inline">
          ⌘K
        </kbd>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 border-white/10 bg-transparent text-white/70 hover:bg-white/4 hover:text-white"
        >
          <Filter className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 px-3 text-xs"
          onClick={onNewConversation}
        >
          <Plus className="size-3.5" />
          {t("newConversation")}
        </Button>
      </div>
    </div>
  );
}
