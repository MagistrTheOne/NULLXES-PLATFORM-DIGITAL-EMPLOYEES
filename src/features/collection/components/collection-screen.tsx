"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Filter, Hexagon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REWARDS_FILTER,
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  activeFilterCount,
  filterRewards,
  getCollectionProgress,
  toggleFilterValue,
  type RewardItem,
  type RewardRarity,
  type RewardType,
  type RewardsFilterState,
} from "@/features/rewards/lib/catalog";
import { resolveRewardPreviewSrc } from "@/features/rewards/lib/cosmetic-assets";
import {
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";

const RARITY_OPTIONS: Array<{ id: RewardRarity; label: string }> = [
  { id: "core", label: "Core" },
  { id: "professional", label: "Professional" },
  { id: "premium", label: "Premium" },
  { id: "executive", label: "Executive" },
  { id: "founders", label: "Founder's" },
];

const TYPE_OPTIONS: Array<{ id: RewardType; label: string }> = [
  { id: "background", label: "Background" },
  { id: "frame", label: "Frame" },
];

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
            <li key={option.id} className="flex items-center gap-2">
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(option.id)}
                id={`collection-filter-${option.id}`}
              />
              <label
                htmlFor={`collection-filter-${option.id}`}
                className="cursor-pointer text-sm text-white/70"
              >
                {option.label}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CollectionScreen({ rewards }: { rewards: RewardItem[] }) {
  const [filter, setFilter] = useState<RewardsFilterState>(DEFAULT_REWARDS_FILTER);
  const [toast, setToast] = useState<string | null>(null);

  const catalogRewards = useMemo(() => rewards, [rewards]);

  const progress = useMemo(
    () => getCollectionProgress(catalogRewards),
    [catalogRewards],
  );

  const featuredRewards = useMemo(
    () =>
      filterRewards(
        catalogRewards.filter((item) => item.featured),
        filter,
      ),
    [catalogRewards, filter],
  );

  const filteredCatalog = useMemo(
    () => filterRewards(catalogRewards, filter),
    [catalogRewards, filter],
  );

  const filterCount = activeFilterCount(filter);

  function patchFilter(patch: Partial<RewardsFilterState>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className={rewardsWorkspaceClass()}>
      <div className="flex w-full flex-1 flex-col gap-6 lg:gap-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Collection
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Featured rewards, progress, and catalog. Equip in Inventory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className={cn(rewardsSecondaryButtonClass, "w-auto px-4")}
              asChild
            >
              <Link href="/dashboard/capsules">Capsules</Link>
            </Button>
            <Button
              type="button"
              className={cn(rewardsSecondaryButtonClass, "w-auto px-4")}
              asChild
            >
              <Link href="/dashboard/inventory">
                Inventory
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

        <div className="flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
            <Input
              value={filter.query}
              onChange={(e) => patchFilter({ query: e.target.value })}
              placeholder="Search collection..."
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
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-8">
            <section>
              <h3 className="mb-4 text-sm font-medium tracking-wide text-white/80 uppercase">
                Featured rewards
              </h3>
              {featuredRewards.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  {featuredRewards.map((item) => {
                    const style = RARITY_STYLES[item.rarity];
                    const preview = resolveRewardPreviewSrc(item);
                    const isFrame = item.type === "frame";
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/dashboard/inventory?item=${item.id}`}
                          className={cn(
                            "relative flex h-full min-h-40 w-full flex-col overflow-hidden rounded-xl border bg-[#1a1a1a] p-4 text-left transition-colors hover:bg-[#1f1f1f]",
                            style.border,
                          )}
                        >
                          {preview ? (
                            <Image
                              src={preview}
                              alt=""
                              fill
                              className={cn(
                                isFrame
                                  ? "object-contain p-6 opacity-70"
                                  : "object-cover opacity-25",
                              )}
                              sizes="200px"
                            />
                          ) : null}
                          <div className="relative z-10">
                            <p
                              className={cn(
                                "text-[10px] tracking-[0.18em] uppercase",
                                style.text,
                              )}
                            >
                              {style.label}
                            </p>
                            {!preview ? (
                              <Hexagon
                                className={cn("mt-3 size-8", style.text)}
                              />
                            ) : (
                              <div className="mt-3 h-8" />
                            )}
                            <p className="mt-3 text-sm text-white">{item.name}</p>
                            <p className="mt-1 text-[11px] text-white/40">
                              {REWARD_TYPE_LABELS[item.type]}
                              {item.owned > 0 ? ` · ×${item.owned}` : ""}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-white/40">
                  No featured rewards match filters.
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-4 text-sm font-medium tracking-wide text-white/80 uppercase">
                Catalog
              </h3>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {filteredCatalog.map((item) => {
                  const style = RARITY_STYLES[item.rarity];
                  const preview = resolveRewardPreviewSrc(item);
                  const isFrame = item.type === "frame";
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/dashboard/inventory?item=${item.id}`}
                        className={cn(
                          "relative flex h-full min-h-36 flex-col overflow-hidden rounded-xl border bg-[#1a1a1a] p-4 transition hover:bg-[#1f1f1f]",
                          style.border,
                          item.owned < 1 && "opacity-50",
                        )}
                      >
                        {preview ? (
                          <Image
                            src={preview}
                            alt=""
                            fill
                            className={cn(
                              isFrame
                                ? "object-contain p-8 opacity-55"
                                : "object-cover opacity-20",
                            )}
                            sizes="180px"
                          />
                        ) : null}
                        <div className="relative z-10">
                          <p
                            className={cn(
                              "text-[10px] tracking-[0.18em] uppercase",
                              style.text,
                            )}
                          >
                            {style.label}
                          </p>
                          <p className="mt-3 text-sm text-white">{item.name}</p>
                          <p className="mt-1 text-[11px] text-white/40">
                            {REWARD_TYPE_LABELS[item.type]} · ×{item.owned}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
    </div>
  );
}
