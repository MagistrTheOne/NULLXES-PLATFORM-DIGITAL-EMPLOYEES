"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Filter, Hexagon, History, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { claimDailyCapsuleAction } from "@/features/rewards/actions/claim-daily-capsule";
import { openCapsuleAction } from "@/features/rewards/actions/open-capsule";
import {
  DEFAULT_REWARDS_FILTER,
  activeFilterCount,
  filterCapsules,
  filterRewards,
  getCollectionProgress,
  getRewardById,
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  toggleFilterValue,
  type CapsuleOffer,
  type CapsulePriceKey,
  type CapsuleTierId,
  type RewardItem,
  type RewardRarity,
  type RewardType,
  type RewardsFilterState,
} from "@/features/rewards/lib/catalog";
import { RewardDetailsSheet } from "@/features/rewards/components/reward-details-sheet";
import {
  rewardsMutedButtonClass,
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "./capsules-ambience";
import {
  CapsuleOpenReveal,
  type CapsuleRevealReward,
} from "./capsule-open-reveal";
import { playCapsuleRevealSfx } from "./capsule-open-sfx";
import { CapsuleProductVisual } from "./capsule-product-visual";
import { CapsuleHistorySheet } from "@/features/capsules/components/capsule-history-sheet";
import type { CapsuleHistoryItem } from "@/features/capsules/lib/history";

export type { CapsuleHistoryItem };

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "store", label: "Store" },
  { id: "inventory", label: "Inventory" },
  { id: "daily", label: "Daily" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RARITY_OPTIONS: Array<{ id: RewardRarity; label: string }> = [
  { id: "core", label: "Core" },
  { id: "professional", label: "Professional" },
  { id: "premium", label: "Premium" },
  { id: "executive", label: "Executive" },
  { id: "founders", label: "Founder's" },
];

const TYPE_OPTIONS: Array<{ id: RewardType; label: string }> = [
  { id: "skill_chip", label: "Skill Chip" },
  { id: "appearance", label: "Appearance" },
  { id: "voice", label: "Voice" },
  { id: "background", label: "Background" },
  { id: "frame", label: "Frame" },
  { id: "idle", label: "Idle Animation" },
];

const PRICE_OPTIONS: Array<{ id: CapsulePriceKey; label: string }> = [
  { id: "free", label: "Free" },
  { id: "99", label: "99 ₽" },
  { id: "4999", label: "4 999 ₽" },
];

const PAID_TIERS: CapsuleTierId[] = ["standard", "executive"];

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function FilterCheckboxGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Array<{ id: T; label: string }>;
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">
        {title}
      </p>
      <ul className="space-y-1.5">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggle(option.id)}
                />
                <span>{option.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
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
      className="flex h-full min-h-112 flex-col justify-between rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4">
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

      <div className="pt-5">
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
  const [pending, startTransition] = useTransition();
  const [checkoutLock, setCheckoutLock] = useState(false);
  const [tab, setTab] = useState<TabId>("featured");
  const [filter, setFilter] = useState<RewardsFilterState>(DEFAULT_REWARDS_FILTER);
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(dailySecondsLeft);
  const [detailsReward, setDetailsReward] = useState<RewardItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const progress = useMemo(() => getCollectionProgress(rewards), [rewards]);
  const filterCount = activeFilterCount(filter);

  const tabCapsules = useMemo(() => {
    let base = offers;
    if (tab === "store") {
      base = base.filter((c) => c.store);
    } else if (tab === "daily") {
      base = base.filter((c) => c.daily);
    } else if (tab === "featured") {
      base = base.filter((c) => c.featured);
    } else if (tab === "inventory") {
      base = base.filter((c) => (c.ownedCount ?? 0) > 0);
    }
    return filterCapsules(base, filter, rewards);
  }, [tab, filter, offers, rewards]);

  const featuredRewards = useMemo(() => {
    const base =
      tab === "inventory"
        ? rewards.filter((item) => item.owned > 0)
        : rewards.filter((item) => item.featured);
    return filterRewards(base, filter);
  }, [tab, filter, rewards]);

  function patchFilter(patch: Partial<RewardsFilterState>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

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
            body: JSON.stringify({ product: "capsule", tierId: offer.id }),
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

  function openRewardDetails(reward: RewardItem) {
    setDetailsReward(reward);
    setDetailsOpen(true);
  }

  return (
    <div className={rewardsWorkspaceClass()}>
      <div className="flex w-full flex-1 flex-col gap-6 lg:gap-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Capsules
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Activate capsules and unlock rewards for your digital employees.
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
              Capsule history
            </Button>
          </div>
        </header>

        {toast ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
              <Input
                value={filter.query}
                onChange={(e) => patchFilter({ query: e.target.value })}
                placeholder="Search..."
                className="h-9 rounded-xl border-white/12 bg-black/30 pl-9 text-sm text-white placeholder:text-white/35"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  className={cn(
                    rewardsSecondaryButtonClass,
                    "h-9 w-auto shrink-0 gap-2 px-3",
                  )}
                >
                  <Filter className="size-3.5" />
                  Filter
                  {filterCount > 0 ? (
                    <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">
                      {filterCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 border-white/12 bg-[#161616] p-4 text-white"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Filters</p>
                  {filterCount > 0 ? (
                    <button
                      type="button"
                      className="text-xs text-white/45 hover:text-white"
                      onClick={() =>
                        setFilter({
                          ...DEFAULT_REWARDS_FILTER,
                          query: filter.query,
                        })
                      }
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                  <FilterCheckboxGroup
                    title="Rarity"
                    options={RARITY_OPTIONS}
                    selected={filter.rarities}
                    onToggle={(id) =>
                      patchFilter({
                        rarities: toggleFilterValue(filter.rarities, id),
                      })
                    }
                  />
                  <FilterCheckboxGroup
                    title="Reward Type"
                    options={TYPE_OPTIONS}
                    selected={filter.rewardTypes}
                    onToggle={(id) =>
                      patchFilter({
                        rewardTypes: toggleFilterValue(filter.rewardTypes, id),
                      })
                    }
                  />
                  <FilterCheckboxGroup
                    title="Price"
                    options={PRICE_OPTIONS}
                    selected={filter.prices}
                    onToggle={(id) =>
                      patchFilter({
                        prices: toggleFilterValue(filter.prices, id),
                      })
                    }
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-8">
            <section className="w-full">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium tracking-wide text-white/80 uppercase">
                  {tab === "inventory" ? "Owned rewards" : "Featured rewards"}
                </h3>
                <Link
                  href="/dashboard/inventory"
                  className="inline-flex items-center gap-1 text-xs text-white/45 transition-colors hover:text-white/80"
                >
                  View all rewards
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {featuredRewards.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  <AnimatePresence mode="popLayout">
                    {featuredRewards.map((item, index) => {
                      const style = RARITY_STYLES[item.rarity];
                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <motion.button
                            type="button"
                            onClick={() => openRewardDetails(item)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex h-full w-full flex-col rounded-xl border bg-[#1a1a1a] p-4 text-left transition-colors hover:bg-[#1f1f1f]",
                              style.border,
                            )}
                          >
                            <p
                              className={cn(
                                "text-[10px] tracking-[0.18em] uppercase",
                                style.text,
                              )}
                            >
                              {style.label}
                            </p>
                            <Hexagon className={cn("mt-3 size-8", style.text)} />
                            <p className="mt-3 text-sm text-white">{item.name}</p>
                            <p className="mt-1 text-[11px] text-white/40">
                              {REWARD_TYPE_LABELS[item.type]}
                            </p>
                          </motion.button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-white/40">
                  No rewards match the current filters.
                </div>
              )}
            </section>

            {tab === "inventory" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
                <p className="text-sm text-white/55">
                  Capsules you already hold. Full collection lives in Inventory.
                </p>
                <Link
                  href="/dashboard/inventory"
                  className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
                >
                  Open Inventory
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : null}

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
                No capsules match the current filters.
              </div>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <h3 className="text-sm font-medium text-white">
                Collection Progress
              </h3>
              <p className="mt-4 font-mono text-2xl text-white">
                {progress.owned}{" "}
                <span className="text-white/35">/ {progress.total}</span>
              </p>
              <p className="mt-1 text-xs text-white/40">Rewards</p>

              <dl className="mt-5 space-y-3 border-t border-white/8 pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40">Completion</dt>
                  <dd className="font-mono text-white/80">
                    {progress.completion}%
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40">Executive owned</dt>
                  <dd className="font-mono text-white/80">
                    {progress.executiveOwned}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40">Founder&apos;s owned</dt>
                  <dd className="font-mono text-white/80">
                    {progress.foundersOwned}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${progress.completion}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
                Bundle
              </p>
              <h3 className="mt-2 text-sm font-medium text-white">
                10× Executive Capsules
              </h3>
              <p className="mt-1 font-mono text-sm text-white/55">44 990 ₽</p>
              <Button
                type="button"
                className={cn("mt-4", rewardsSecondaryButtonClass)}
                onClick={() =>
                  setToast("Bundle checkout — coming with billing.")
                }
              >
                View bundle
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <RewardDetailsSheet
        reward={detailsReward}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEquipStub={(reward) => {
          setToast(`Open Inventory to equip ${reward.name}.`);
          setDetailsOpen(false);
        }}
      />

      <CapsuleHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        items={history}
      />

      <CapsuleOpenReveal
        open={revealOpen}
        tierId={revealTierId}
        reward={revealReward}
        onPhaseChange={playCapsuleRevealSfx}
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
