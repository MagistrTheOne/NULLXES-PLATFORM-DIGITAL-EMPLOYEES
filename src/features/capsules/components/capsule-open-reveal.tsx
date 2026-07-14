"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  type CapsuleTierId,
  type RewardRarity,
  type RewardType,
} from "@/features/rewards/lib/catalog";
import { rewardsPrimaryButtonClass } from "@/features/rewards/lib/workspace-shell";
import { CapsuleProductVisual } from "./capsule-product-visual";

export type CapsuleRevealPhase = "charge" | "open" | "reveal";

export type CapsuleRevealReward = {
  slug: string;
  name: string;
  rarity: RewardRarity;
  type?: RewardType;
};

const PHASE_MS: Record<Exclude<CapsuleRevealPhase, "reveal">, number> = {
  charge: 900,
  open: 500,
};

/**
 * Overlay reveal after Claim / Open.
 * onPhaseChange is a hook for SFX tomorrow (charge / open→crack / reveal).
 */
export function CapsuleOpenReveal({
  open,
  tierId,
  reward,
  onOpenChange,
  onDone,
  onPhaseChange,
}: {
  open: boolean;
  tierId: CapsuleTierId | null;
  reward: CapsuleRevealReward | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  onPhaseChange?: (phase: CapsuleRevealPhase) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<CapsuleRevealPhase>("charge");
  const onPhaseChangeRef = useRef(onPhaseChange);
  onPhaseChangeRef.current = onPhaseChange;

  useEffect(() => {
    if (!open || !reward || !tierId) {
      return;
    }

    if (reduceMotion) {
      setPhase("reveal");
      onPhaseChangeRef.current?.("reveal");
      return;
    }

    setPhase("charge");
    onPhaseChangeRef.current?.("charge");

    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setPhase("open");
        onPhaseChangeRef.current?.("open");
      }, PHASE_MS.charge),
    );
    timers.push(
      window.setTimeout(() => {
        setPhase("reveal");
        onPhaseChangeRef.current?.("reveal");
      }, PHASE_MS.charge + PHASE_MS.open),
    );

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [open, reward, tierId, reduceMotion]);

  const style = reward ? RARITY_STYLES[reward.rarity] : null;

  function handleDone() {
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={phase === "reveal"}
        className="max-w-md border-white/12 bg-[#121212] text-white ring-white/10 sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Capsule open</DialogTitle>
          <DialogDescription>
            Reveal animation for the reward drop.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex min-h-72 flex-col items-center justify-center py-2">
          <AnimatePresence mode="wait">
            {phase !== "reveal" && tierId ? (
              <motion.div
                key={`capsule-${phase}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{
                  opacity: phase === "open" ? 0 : 1,
                  scale: phase === "charge" ? 1.04 : 1.12,
                  filter:
                    phase === "open"
                      ? "brightness(2)"
                      : "brightness(1)",
                }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-xs"
              >
                <CapsuleProductVisual tier={tierId} className="h-56" />
                <p className="mt-3 text-center text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  {phase === "charge" ? "Charging" : "Opening"}
                </p>
              </motion.div>
            ) : null}

            {phase === "reveal" && reward && style ? (
              <motion.div
                key="reveal"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full flex-col items-center text-center"
              >
                <div
                  className={cn(
                    "flex size-24 items-center justify-center rounded-2xl border bg-black/40",
                    style.border,
                  )}
                >
                  <Hexagon className={cn("size-12", style.text)} />
                </div>
                <p
                  className={cn(
                    "mt-4 text-[10px] tracking-[0.22em] uppercase",
                    style.text,
                  )}
                >
                  {style.label}
                </p>
                <h2 className="mt-2 text-xl font-medium text-white">
                  {reward.name}
                </h2>
                {reward.type ? (
                  <p className="mt-1 text-xs text-white/45">
                    {REWARD_TYPE_LABELS[reward.type]}
                  </p>
                ) : null}
                <Button
                  type="button"
                  className={cn("mt-6 w-auto px-8", rewardsPrimaryButtonClass)}
                  onClick={handleDone}
                >
                  Continue
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
