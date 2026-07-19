"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowRight, History, Hexagon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { claimDailyCapsuleAction } from "@/features/rewards/actions/claim-daily-capsule";
import { openCapsuleAction } from "@/features/rewards/actions/open-capsule";
import {
  RARITY_STYLES,
  getRewardById,
  type CapsuleOffer,
  type CapsuleTierId,
  type RewardItem,
} from "@/features/rewards/lib/catalog";
import {
  rewardsMutedButtonClass,
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "./capsules-ambience";
import { CapsulesAnnaEntrance } from "./capsules-anna-entrance";
import {
  CapsuleOpenReveal,
  type CapsuleRevealReward,
} from "./capsule-open-reveal";
import { playCapsuleRevealSfx } from "./capsule-open-sfx";
import { CapsuleProductVisual } from "./capsule-product-visual";
import { CapsuleHistorySheet } from "@/features/capsules/components/capsule-history-sheet";
import type { CapsuleHistoryItem } from "@/features/capsules/lib/history";
import { getCapsuleRoomSrc } from "@/features/capsules/lib/capsule-assets";
import Image from "next/image";

export type { CapsuleHistoryItem };

const TABS = [
  { id: "store", label: "Store" },
  { id: "daily", label: "Daily" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PAID_TIERS: CapsuleTierId[] = ["standard", "executive"];

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function CapsuleCard({
  offer,
  secondsLeft,
  onActivate,
  index,
  rewards,
  busy,
}: {
  offer: CapsuleOffer;
  secondsLeft: number;
  onActivate: (offer: CapsuleOffer) => void;
  index: number;
  rewards: RewardItem[];
  busy: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const roomSrc = getCapsuleRoomSrc(offer.id);

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{
        duration: 0.4,
        delay: reduceMotion ? 0 : index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="relative flex h-full min-h-112 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={roomSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover opacity-[0.22]"
          priority={index < 2}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#1a1a1a]/78 to-[#1a1a1a]" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              {offer.daily ? "Daily" : "Capsule"}
            </p>
            <h2 className="mt-1 truncate text-lg font-medium text-white">
              {offer.name}
            </h2>
          </div>
          <span className="shrink-0 rounded-lg border border-white/12 px-2.5 py-1 font-mono text-xs text-white/70">
            {offer.priceLabel}
          </span>
        </div>

        <CapsuleProductVisual tier={offer.id} />

        <p className="min-h-10 text-sm leading-relaxed text-white/45">
          {offer.blurb}
        </p>

        <div className="min-h-5">
          {offer.claimed ? (
            <p className="font-mono text-xs text-white/40">
              Next in {formatCountdown(secondsLeft)} · 1/1
            </p>
          ) : (offer.ownedCount ?? 0) > 0 && !offer.daily ? (
            <p className="font-mono text-xs text-white/40">
              Owned · {offer.ownedCount}
            </p>
          ) : (
            <p className="text-xs text-transparent select-none">.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {offer.rewardPreviewIds.map((id) => {
            const reward = getRewardById(id, rewards);
            if (!reward) return null;
            const style = RARITY_STYLES[reward.rarity];
            return (
              <motion.span
                key={id}
                whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg border bg-black/40",
                  style.border,
                )}
                title={reward.name}
              >
                <Hexagon className={cn("size-3.5", style.text)} />
              </motion.span>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 pt-5">
        <motion.div
          whileTap={
            offer.claimed || busy || reduceMotion ? undefined : { scale: 0.98 }
          }
        >
          <Button
            type="button"
            disabled={offer.claimed || busy}
            onClick={() => onActivate(offer)}
            className={
              offer.claimed
                ? rewardsMutedButtonClass
                : rewardsPrimaryButtonClass
            }
          >
            {offer.activateLabel}
          </Button>
        </motion.div>
      </div>
    </motion.article>
  );
}

export type CapsulesScreenProps = {
  offers: CapsuleOffer[];
  rewards: RewardItem[];
  dailySecondsLeft: number;
  history: CapsuleHistoryItem[];
};

export function CapsulesScreen({
  offers,
  rewards,
  dailySecondsLeft,
  history,
}: CapsulesScreenProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [checkoutLock, setCheckoutLock] = useState(false);
  const [tab, setTab] = useState<TabId>("store");
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(dailySecondsLeft);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealTierId, setRevealTierId] = useState<CapsuleTierId | null>(null);
  const [revealReward, setRevealReward] = useState<CapsuleRevealReward | null>(
    null,
  );

  function startReveal(tierId: CapsuleTierId, reward: CapsuleRevealReward) {
    setRevealTierId(tierId);
    setRevealReward(reward);
    setRevealOpen(true);
  }

  useEffect(() => {
    setSecondsLeft(dailySecondsLeft);
  }, [dailySecondsLeft]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const tabCapsules = useMemo(() => {
    if (tab === "daily") {
      return offers.filter((c) => c.daily);
    }
    return offers.filter((c) => c.store || c.featured);
  }, [tab, offers]);

  function onActivate(offer: CapsuleOffer) {
    if (offer.claimed) {
      setToast("Daily capsule already claimed. Next drop when the timer ends.");
      return;
    }

    if (offer.daily) {
      startTransition(async () => {
        const result = await claimDailyCapsuleAction();
        if (!result.ok) {
          setToast(result.message);
          return;
        }
        const catalog = rewards.find((item) => item.id === result.reward.slug);
        startReveal(offer.id, {
          ...result.reward,
          type: catalog?.type,
        });
      });
      return;
    }

    if ((offer.ownedCount ?? 0) > 0) {
      startTransition(async () => {
        const result = await openCapsuleAction(offer.id);
        if (!result.ok) {
          setToast(result.message);
          return;
        }
        const catalog = rewards.find((item) => item.id === result.reward.slug);
        startReveal(offer.id, {
          ...result.reward,
          type: catalog?.type,
        });
      });
      return;
    }

    if (PAID_TIERS.includes(offer.id)) {
      if (checkoutLock || pending) return;
      setCheckoutLock(true);
      startTransition(async () => {
        try {
          const response = await fetch("/api/billing/tbank/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: "capsule",
              tierId: offer.id,
              locale,
            }),
          });
          const data = (await response.json()) as {
            paymentUrl?: string;
            error?: string;
            errorCode?: string;
          };
          if (!response.ok || !data.paymentUrl) {
            setToast(
              data.error ??
                (data.errorCode
                  ? `T-Bank error ${data.errorCode}`
                  : "T-Bank checkout unavailable."),
            );
            setCheckoutLock(false);
            return;
          }
          window.location.assign(data.paymentUrl);
        } catch {
          setToast("Unable to start T-Bank payment.");
          setCheckoutLock(false);
        }
      });
      return;
    }

    setToast("This capsule cannot be activated.");
  }

  return (
    <div className={rewardsWorkspaceClass()}>
      <CapsulesAnnaEntrance />
      <div className="flex w-full flex-1 flex-col gap-6 lg:gap-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Capsules
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Claim and open capsules. Collection and loadout live elsewhere.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CapsulesAmbienceToggle />
            <Button
              type="button"
              className={cn(rewardsSecondaryButtonClass, "w-auto px-4")}
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4" />
              History
            </Button>
            <Button
              type="button"
              className={cn(rewardsSecondaryButtonClass, "w-auto px-4")}
              asChild
            >
              <Link href="/dashboard/collection">
                Collection
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        {toast ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs tracking-wide transition-colors",
                tab === item.id
                  ? "bg-white text-black"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tabCapsules.length > 0 ? (
          <ul className="grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {tabCapsules.map((offer, index) => (
                <li key={offer.id} className="min-w-0">
                  <CapsuleCard
                    offer={offer}
                    secondsLeft={secondsLeft}
                    onActivate={onActivate}
                    index={index}
                    rewards={rewards}
                    busy={pending || checkoutLock}
                  />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 bg-[#161616] px-6 py-16 text-center text-sm text-white/40">
            No capsules in this tab.
          </div>
        )}
      </div>

      <CapsuleHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        items={history}
      />

      <CapsuleOpenReveal
        open={revealOpen}
        tierId={revealTierId}
        reward={revealReward}
        onPhaseChange={(phase) => playCapsuleRevealSfx(phase, revealTierId)}
        onOpenChange={(next) => {
          setRevealOpen(next);
          if (!next) {
            setToast(null);
            router.refresh();
          }
        }}
        onDone={() => {
          setToast(null);
          router.refresh();
        }}
      />
    </div>
  );
}
