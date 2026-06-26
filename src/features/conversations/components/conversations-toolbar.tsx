"use client";

import { useTranslations } from "next-intl";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
      <InputGroup className="h-10 w-full border-white/8 bg-white/2 shadow-none sm:w-[280px] has-[[data-slot=input-group-control]:focus-visible]:border-white/16 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupAddon align="inline-start" className="text-white/35">
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="text-sm text-white placeholder:text-white/35"
        />
        <InputGroupAddon align="inline-end" className="hidden sm:flex">
          <InputGroupText>
            <kbd className="rounded-md border border-white/8 bg-white/3 px-1.5 py-0.5 text-[10px] font-medium text-white/35">
              ⌘K
            </kbd>
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 border-white/8 bg-white/2 text-white/60 hover:bg-white/4 hover:text-white"
            >
              <Filter className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Filter</TooltipContent>
        </Tooltip>

        <Button
          type="button"
          className="h-10 shrink-0 gap-2 px-4 text-xs font-medium"
          onClick={onNewConversation}
        >
          <Plus className="size-4" />
          {t("newConversation")}
        </Button>
      </div>
    </div>
  );
}
