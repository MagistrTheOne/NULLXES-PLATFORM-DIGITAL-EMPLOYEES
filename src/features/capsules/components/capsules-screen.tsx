"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Hexagon, History, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REWARDS_FILTER,
  filterCapsules,
  filterRewards,
  getCollectionProgress,
  getRewardById,
  MOCK_CAPSULE_OFFERS,
  MOCK_REWARD_ITEMS,
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  type CapsuleOffer,
  type CapsulePriceKey,
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
import { CapsuleProductVisual } from "./capsule-product-visual";

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "store", label: "Store" },
  { id: "inventory", label: "Inventory" },
  { id: "daily", label: "Daily" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RARITY_FILTERS: Array<{ id: "all" | RewardRarity; label: string }> = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "professional", label: "Professional" },
  { id: "premium", label: "Premium" },
  { id: "executive", label: "Executive" },
  { id: "founders", label: "Founder's" },
];

const TYPE_FILTERS: Array<{ id: "all" | RewardType; label: string }> = [
  { id: "all", label: "All" },
  { id: "skill_chip", label: "Skill Chip" },
  { id: "appearance", label: "Appearance" },
  { id: "voice", label: "Voice" },
  { id: "background", label: "Background" },
  { id: "frame", label: "Frame" },
  { id: "idle", label: "Idle Animation" },
];

const PRICE_FILTERS: Array<{ id: "all" | CapsulePriceKey; label: string }> = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "99", label: "99 ₽" },
  { id: "4999", label: "4 999 ₽" },
];

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-xs tracking-wide transition-colors",
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/80",
      )}
    >
      {label}
    </button>
  );
}

function CapsuleCard({
  offer,
  secondsLeft,
  onActivate,
  index,
}: {
  offer: CapsuleOffer;
  secondsLeft: number;
  onActivate: (offer: CapsuleOffer) => void;
  index: number;
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
      className="flex h-full min-h-[28rem] flex-col justify-between rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6"
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
          ) : (
            <p className="text-xs text-transparent select-none">.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {offer.rewardPreviewIds.map((id) => {
            const reward = getRewardById(id);
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
            offer.claimed || reduceMotion ? undefined : { scale: 0.98 }
          }
        >
          <Button
            type="button"
            disabled={offer.claimed}
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

export function CapsulesScreen() {
  const [tab, setTab] = useState<TabId>("featured");
  const [filter, setFilter] = useState<RewardsFilterState>(DEFAULT_REWARDS_FILTER);
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(19 * 3600 + 32 * 60 + 45);
  const [detailsReward, setDetailsReward] = useState<RewardItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const progress = useMemo(() => getCollectionProgress(), []);

  const tabCapsules = useMemo(() => {
    let base = MOCK_CAPSULE_OFFERS;
    if (tab === "store") {
      base = base.filter((c) => c.store);
    } else if (tab === "daily") {
      base = base.filter((c) => c.daily);
    } else if (tab === "featured") {
      base = base.filter((c) => c.featured);
    } else if (tab === "inventory") {
      base = base.filter((c) => (c.ownedCount ?? 0) > 0);
    }
    return filterCapsules(base, filter);
  }, [tab, filter]);

  const featuredRewards = useMemo(() => {
    const base =
      tab === "inventory"
        ? MOCK_REWARD_ITEMS.filter((item) => item.owned > 0)
        : MOCK_REWARD_ITEMS.filter((item) => item.featured);
    return filterRewards(base, filter);
  }, [tab, filter]);

  function patchFilter(patch: Partial<RewardsFilterState>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

  function onActivate(offer: CapsuleOffer) {
    if (offer.claimed) {
      setToast("Daily capsule already claimed. Next drop when the timer ends.");
      return;
    }
    setToast("Activate is a UI stub — payment and server drop come next.");
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
              onClick={() => setToast("Capsule history — coming soon.")}
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
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
            <Input
              value={filter.query}
              onChange={(e) => patchFilter({ query: e.target.value })}
              placeholder="Search..."
              className="h-9 rounded-xl border-white/12 bg-black/30 pl-9 text-sm text-white placeholder:text-white/35"
            />
          </div>
        </div>

        <section className="space-y-4 rounded-2xl border border-white/8 bg-[#161616] p-4 sm:p-5">
          <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
            Filter
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <span className="w-28 shrink-0 text-xs text-white/40">Rarity</span>
              <div className="flex flex-wrap gap-2">
                {RARITY_FILTERS.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    active={filter.rarity === item.id}
                    onClick={() => patchFilter({ rarity: item.id })}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <span className="w-28 shrink-0 text-xs text-white/40">
                Reward Type
              </span>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    active={filter.rewardType === item.id}
                    onClick={() => patchFilter({ rewardType: item.id })}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <span className="w-28 shrink-0 text-xs text-white/40">Price</span>
              <div className="flex flex-wrap gap-2">
                {PRICE_FILTERS.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    active={filter.price === item.id}
                    onClick={() => patchFilter({ price: item.id })}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-8">
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

            <section className="w-full border-t border-white/8 pt-6">
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
              <h3 className="text-sm font-medium text-white">Loop</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/50">
                <li>
                  <span className="text-white/80">Capsules</span> → activate
                </li>
                <li>
                  <span className="text-white/80">Inventory</span> → collect
                </li>
                <li>
                  <span className="text-white/80">Details</span> → inspect
                </li>
                <li>
                  <span className="text-white/80">Equip</span> → apply
                </li>
              </ul>
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
          setToast(`Equip stub: ${reward.name} → employee (mock).`);
          setDetailsOpen(false);
        }}
      />
    </div>
  );
}
