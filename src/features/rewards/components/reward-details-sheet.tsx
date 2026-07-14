"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  MOCK_EMPLOYEE_TARGETS,
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  type RewardItem,
} from "@/features/rewards/lib/catalog";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
} from "@/features/rewards/lib/workspace-shell";

type RewardDetailsSheetProps = {
  reward: RewardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipStub?: (reward: RewardItem) => void;
};

/**
 * Reward Details — separate entity in Capsules → Inventory → Details → Equip.
 * Mock only; no backend.
 */
export function RewardDetailsSheet({
  reward,
  open,
  onOpenChange,
  onEquipStub,
}: RewardDetailsSheetProps) {
  const style = reward ? RARITY_STYLES[reward.rarity] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/10 bg-[#121212] text-white sm:max-w-md"
      >
        {reward && style ? (
          <>
            <SheetHeader className="border-b border-white/8 pb-4 text-left">
              <p
                className={cn(
                  "text-[10px] tracking-[0.2em] uppercase",
                  style.text,
                )}
              >
                {style.label}
              </p>
              <SheetTitle className="text-xl text-white">{reward.name}</SheetTitle>
              <SheetDescription className="text-white/50">
                Reward Details · mock
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-6">
              <div
                className={cn(
                  "mx-auto flex size-28 items-center justify-center rounded-2xl border bg-black/40",
                  style.border,
                )}
              >
                <Hexagon className={cn("size-12", style.text)} />
              </div>

              <p className="text-sm leading-relaxed text-white/55">
                {reward.description}
              </p>

              <dl className="space-y-2 border-t border-white/8 pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Type</dt>
                  <dd className="text-white/80">
                    {REWARD_TYPE_LABELS[reward.type]}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Rarity</dt>
                  <dd className={style.text}>{style.label}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Owned</dt>
                  <dd className="font-mono text-white/80">{reward.owned}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Compatible</dt>
                  <dd className="text-white/80">{reward.compatible}</dd>
                </div>
                {reward.boostLabel ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Modifier</dt>
                    <dd className={cn("font-mono", style.text)}>
                      {reward.boostLabel}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="space-y-3 border-t border-white/8 pt-4">
                <p className="text-xs text-white/40">
                  Equip target (mock): {MOCK_EMPLOYEE_TARGETS[0].name}
                </p>
                <Button
                  type="button"
                  className={rewardsPrimaryButtonClass}
                  onClick={() => onEquipStub?.(reward)}
                >
                  Equip
                </Button>
                <Button asChild type="button" className={rewardsSecondaryButtonClass}>
                  <Link href={`/dashboard/inventory?item=${reward.id}`}>
                    Open in Inventory
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
