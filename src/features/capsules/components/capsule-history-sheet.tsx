"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RARITY_STYLES } from "@/features/rewards/lib/catalog";
import { cn } from "@/lib/utils";
import type { CapsuleHistoryItem } from "./capsules-screen";

const TIER_LABEL: Record<string, string> = {
  daily: "Base",
  standard: "Diamond",
  executive: "Gold",
};

export function CapsuleHistorySheet({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CapsuleHistoryItem[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="border-white/10 bg-[#121212] text-white sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Capsule history</SheetTitle>
          <SheetDescription className="text-white/45">
            Recent opens and daily claims for this workspace.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-white/40">No opens yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => {
              const style = RARITY_STYLES[item.rarity];
              return (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-xl border bg-[#1a1a1a] px-4 py-3",
                    style.border,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {item.rewardName}
                      </p>
                      <p className="mt-1 text-[11px] text-white/40">
                        {TIER_LABEL[item.tierId] ?? item.tierId} · {item.source}{" "}
                        · {style.label}
                      </p>
                    </div>
                    <time className="shrink-0 font-mono text-[10px] text-white/35">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
