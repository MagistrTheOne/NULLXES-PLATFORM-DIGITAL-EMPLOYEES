"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Hexagon,
  Mic,
  Search,
  Shirt,
  Sparkles,
  Square,
  Star,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  type CapsuleOffer,
  type CapsuleTierId,
  type RewardItem,
  type RewardRarity,
  type RewardType,
} from "@/features/rewards/lib/catalog";
import {
  emptyLoadout,
  isItemEquippedAnywhere,
  isItemEquippedOnLoadout,
  type EmployeeLoadout,
} from "@/features/rewards/lib/loadout";
import { equipRewardOnEmployeeAction } from "@/features/rewards/actions/equip-reward";
import { openCapsuleAction } from "@/features/rewards/actions/open-capsule";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "@/features/capsules/components/capsules-ambience";
import {
  CapsuleOpenReveal,
  type CapsuleRevealReward,
} from "@/features/capsules/components/capsule-open-reveal";
import { playCapsuleRevealSfx } from "@/features/capsules/components/capsule-open-sfx";
import { CapsuleProductVisual } from "@/features/capsules/components/capsule-product-visual";

const TYPE_FILTERS: Array<{
  id: "all" | "equipped" | "capsules" | RewardType;
  label: string;
}> = [
  { id: "all", label: "All Items" },
  { id: "capsules", label: "Capsules" },
  { id: "equipped", label: "Equipped" },
  { id: "skill_chip", label: "Skill Chips" },
  { id: "appearance", label: "Appearance" },
  { id: "voice", label: "Voice" },
  { id: "idle", label: "Idle" },
  { id: "background", label: "Background" },
  { id: "frame", label: "Frame" },
];

const RARITY_RANK: Record<RewardRarity, number> = {
  founders: 5,
  executive: 4,
  premium: 3,
  professional: 2,
  core: 1,
};

type SortId =
  | "rarity"
  | "newest"
  | "name"
  | "recent"
  | "equipped"
  | "duplicates";

type Selection =
  | { kind: "reward"; id: string }
  | { kind: "capsule"; id: CapsuleTierId };

function typeIcon(type: RewardType) {
  switch (type) {
    case "skill_chip":
      return Sparkles;
    case "appearance":
      return Shirt;
    case "voice":
      return Mic;
    case "idle":
      return UserRound;
    case "background":
      return Square;
    case "frame":
      return Hexagon;
    default:
      return Hexagon;
  }
}

export function InventoryScreen({
  rewards,
  offers = [],
  employees,
  loadouts: initialLoadouts,
}: {
  rewards: RewardItem[];
  offers?: CapsuleOffer[];
  employees: Array<{ id: string; name: string }>;
  loadouts: Record<string, EmployeeLoadout>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("item");
  const [loadouts, setLoadouts] = useState(initialLoadouts);
  const [filter, setFilter] =
    useState<(typeof TYPE_FILTERS)[number]["id"]>("all");

  useEffect(() => {
    setLoadouts(initialLoadouts);
  }, [initialLoadouts]);

  const ownedCapsules = useMemo(
    () =>
      offers.filter(
        (offer) => !offer.daily && (offer.ownedCount ?? 0) > 0,
      ),
    [offers],
  );

  const [sort, setSort] = useState<SortId>("rarity");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection | null>(() => {
    if (
      initialId &&
      rewards.some((item) => item.id === initialId && item.owned > 0)
    ) {
      return { kind: "reward", id: initialId };
    }
    const firstOwned = rewards.find((item) => item.owned > 0);
    if (firstOwned) return { kind: "reward", id: firstOwned.id };
    if (ownedCapsules[0]) return { kind: "capsule", id: ownedCapsules[0].id };
    return null;
  });
  const [toast, setToast] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealTierId, setRevealTierId] = useState<CapsuleTierId | null>(null);
  const [revealReward, setRevealReward] = useState<CapsuleRevealReward | null>(
    null,
  );

  const rewardItems = useMemo(() => {
    // Inventory = owned holdings only (catalog ×0 gap-fillers stay in Capsules store).
    let list = rewards.filter((item) => item.owned > 0);

    if (filter === "equipped") {
      list = list.filter((item) => isItemEquippedAnywhere(loadouts, item.id));
    } else if (filter === "capsules") {
      list = [];
    } else if (filter !== "all") {
      list = list.filter((item) => item.type === filter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return (
            rewards.findIndex((i) => i.id === a.id) -
            rewards.findIndex((i) => i.id === b.id)
          );
        case "duplicates":
          return b.owned - a.owned || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
        case "equipped": {
          const ae = isItemEquippedAnywhere(loadouts, a.id) ? 1 : 0;
          const be = isItemEquippedAnywhere(loadouts, b.id) ? 1 : 0;
          return be - ae || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
        }
        case "recent":
        case "rarity":
        default:
          return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
      }
    });

    return list;
  }, [filter, query, sort, loadouts, rewards]);

  const capsuleItems = useMemo(() => {
    if (filter === "equipped") return [];
    if (filter !== "all" && filter !== "capsules") return [];

    let list = [...ownedCapsules];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((offer) => offer.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filter, query, ownedCapsules]);

  const selectedReward: RewardItem | null =
    selected?.kind === "reward"
      ? (rewards.find((item) => item.id === selected.id) ?? null)
      : null;
  const selectedCapsule: CapsuleOffer | null =
    selected?.kind === "capsule"
      ? (ownedCapsules.find((offer) => offer.id === selected.id) ??
        offers.find((offer) => offer.id === selected.id) ??
        null)
      : null;

  const selectedStyle = selectedReward
    ? RARITY_STYLES[selectedReward.rarity]
    : null;
  const isFavorite = selectedReward
    ? Boolean(favorites[selectedReward.id])
    : false;

  const totalVisible = rewardItems.length + capsuleItems.length;

  function onEquip(employeeId: string, employeeName: string) {
    if (!selectedReward) return;
    startTransition(async () => {
      const result = await equipRewardOnEmployeeAction({
        employeeId,
        rewardSlug: selectedReward.id,
      });
      if (!result.ok) {
        setToast(result.message);
        return;
      }
      setLoadouts((prev) => {
        const current = prev[employeeId] ?? emptyLoadout();
        const next = { ...current, skillChipIds: [...current.skillChipIds] };
        switch (selectedReward.type) {
          case "appearance":
            next.appearanceId = selectedReward.id;
            break;
          case "voice":
            next.voiceId = selectedReward.id;
            break;
          case "background":
            next.backgroundId = selectedReward.id;
            break;
          case "idle":
            next.idleId = selectedReward.id;
            break;
          case "frame":
            next.frameId = selectedReward.id;
            break;
          case "skill_chip": {
            const emptyIndex = next.skillChipIds.findIndex((id) => !id);
            if (emptyIndex >= 0) next.skillChipIds[emptyIndex] = selectedReward.id;
            else next.skillChipIds[0] = selectedReward.id;
            break;
          }
        }
        return { ...prev, [employeeId]: next };
      });
      setToast(`${selectedReward.name} → ${employeeName}`);
      router.refresh();
    });
  }

  function onOpenCapsule(offer: CapsuleOffer) {
    startTransition(async () => {
      const result = await openCapsuleAction(offer.id);
      if (!result.ok) {
        setToast(result.message);
        return;
      }
      const catalog = rewards.find((item) => item.id === result.reward.slug);
      setRevealTierId(offer.id);
      setRevealReward({
        ...result.reward,
        type: catalog?.type,
      });
      setRevealOpen(true);
    });
  }

  return (
    <div className={rewardsWorkspaceClass()}>
      <div className="flex w-full flex-1 flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Inventory
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Reward library. Owned capsules open here; equip applies to a
              digital employee loadout.
            </p>
          </div>
          <CapsulesAmbienceToggle />
        </header>

        {toast ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-white/8 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs tracking-wide transition-colors",
                    filter === item.id
                      ? "bg-white text-black"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search inventory..."
                  className="h-9 rounded-xl border-white/12 bg-black/30 pl-9 text-sm text-white placeholder:text-white/35"
                />
              </div>
              <Select value={sort} onValueChange={(value) => setSort(value as SortId)}>
                <SelectTrigger className="h-9 w-full rounded-xl border-white/12 bg-black/30 text-white sm:w-44">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="recent">Recently Used</SelectItem>
                  <SelectItem value="equipped">Equipped</SelectItem>
                  <SelectItem value="duplicates">Duplicates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {capsuleItems.map((offer) => {
                const active =
                  selected?.kind === "capsule" && selected.id === offer.id;
                return (
                  <li key={`capsule-${offer.id}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({ kind: "capsule", id: offer.id })
                      }
                      className={cn(
                        "relative flex h-full min-h-48 w-full flex-col rounded-2xl border border-white/12 bg-[#1a1a1a] p-4 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#1f1f1f]",
                        active && "ring-1 ring-white/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] tracking-[0.18em] text-white/45 uppercase">
                          Capsule
                        </p>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/60">
                          ×{offer.ownedCount ?? 0}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/30">
                        <CapsuleProductVisual
                          tier={offer.id}
                          className="h-28 w-full rounded-none"
                        />
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">
                        {offer.name}
                      </p>
                      <p className="mt-1 text-[11px] text-white/40">
                        {offer.priceLabel}
                      </p>
                    </button>
                  </li>
                );
              })}

              {rewardItems.map((item) => {
                const style = RARITY_STYLES[item.rarity];
                const Icon = typeIcon(item.type);
                const active =
                  selected?.kind === "reward" && selected.id === item.id;
                const equipped = isItemEquippedAnywhere(loadouts, item.id);
                const favorite = Boolean(favorites[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({ kind: "reward", id: item.id })
                      }
                      className={cn(
                        "relative flex h-full min-h-48 w-full flex-col rounded-2xl border bg-[#1a1a1a] p-4 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#1f1f1f]",
                        style.border,
                        active && "ring-1 ring-white/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[10px] tracking-[0.18em] uppercase",
                            style.text,
                          )}
                        >
                          {style.label}
                        </p>
                        <div className="flex items-center gap-1">
                          {favorite ? (
                            <Star className="size-3 fill-white text-white" />
                          ) : null}
                          {equipped ? (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] tracking-wide text-white/60 uppercase">
                              On
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-1 items-center justify-center">
                        <Icon className={cn("size-10", style.text)} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-end justify-between gap-2">
                        <p className="text-[11px] text-white/40">
                          {REWARD_TYPE_LABELS[item.type]}
                        </p>
                        <span className="font-mono text-[10px] text-white/35">
                          ×{item.owned}
                        </span>
                      </div>
                      {item.boostLabel ? (
                        <p className={cn("mt-2 text-xs font-mono", style.text)}>
                          {item.boostLabel}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}

              {totalVisible === 0 ? (
                <li className="col-span-full">
                  <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-[#161616] p-4 text-center text-sm text-white/40">
                    {filter === "capsules"
                      ? "No owned capsules. Activate on Capsules store."
                      : "No items match the current filters."}
                  </div>
                </li>
              ) : null}
            </ul>
            <p className="mt-4 text-xs text-white/30">
              Showing {totalVisible} owned item
              {totalVisible === 1 ? "" : "s"}
            </p>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              {selectedCapsule ? (
                <>
                  <div className="mx-auto overflow-hidden rounded-2xl border border-white/12 bg-black/40">
                    <CapsuleProductVisual
                      tier={selectedCapsule.id}
                      className="h-36 w-full rounded-none"
                    />
                  </div>
                  <p className="mt-4 text-center text-[10px] tracking-[0.22em] text-white/45 uppercase">
                    Capsule
                  </p>
                  <h2 className="mt-2 text-center text-xl font-medium text-white">
                    {selectedCapsule.name}
                  </h2>
                  <p className="mt-2 text-center text-[11px] text-white/40">
                    Owned · {selectedCapsule.ownedCount ?? 0}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {selectedCapsule.blurb}
                  </p>
                  <Button
                    type="button"
                    disabled={pending || (selectedCapsule.ownedCount ?? 0) < 1}
                    className={cn("mt-5", rewardsPrimaryButtonClass)}
                    onClick={() => onOpenCapsule(selectedCapsule)}
                  >
                    Open
                  </Button>
                  <Button asChild className={cn("mt-2", rewardsSecondaryButtonClass)}>
                    <Link href="/dashboard/capsules">Back to Capsules</Link>
                  </Button>
                </>
              ) : selectedReward && selectedStyle ? (
                <>
                  <div
                    className={cn(
                      "mx-auto flex size-28 items-center justify-center rounded-2xl border bg-black/40",
                      selectedStyle.border,
                    )}
                  >
                    {(() => {
                      const Icon = typeIcon(selectedReward.type);
                      return (
                        <Icon className={cn("size-12", selectedStyle.text)} />
                      );
                    })()}
                  </div>
                  <p
                    className={cn(
                      "mt-4 text-center text-[10px] tracking-[0.22em] uppercase",
                      selectedStyle.text,
                    )}
                  >
                    {selectedStyle.label}
                  </p>
                  <h2 className="mt-2 text-center text-xl font-medium text-white">
                    {selectedReward.name}
                  </h2>
                  <p className="mt-2 text-center text-[11px] text-white/40">
                    Preview · {REWARD_TYPE_LABELS[selectedReward.type]}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {selectedReward.description}
                  </p>

                  <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/40">Owned</dt>
                      <dd className="font-mono text-white/80">
                        ×{selectedReward.owned}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/40">Compatible</dt>
                      <dd className="text-white/80">
                        {selectedReward.compatible}
                      </dd>
                    </div>
                  </dl>

                  <Button
                    type="button"
                    className={cn("mt-4", rewardsSecondaryButtonClass)}
                    onClick={() => {
                      setFavorites((prev) => ({
                        ...prev,
                        [selectedReward.id]: !prev[selectedReward.id],
                      }));
                      setToast(
                        isFavorite
                          ? `Removed ${selectedReward.name} from favorites.`
                          : `Favorited ${selectedReward.name}.`,
                      );
                    }}
                  >
                    <Star
                      className={cn(
                        "size-4",
                        isFavorite && "fill-white text-white",
                      )}
                    />
                    {isFavorite ? "Favorited" : "Favorite"}
                  </Button>

                  <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
                    <p className="text-xs tracking-wide text-white/40 uppercase">
                      Compatible Employees
                    </p>
                    <ul className="space-y-2">
                      {employees.length === 0 ? (
                        <li className="text-sm text-white/40">
                          No digital employees yet.
                        </li>
                      ) : (
                        employees.map((employee) => {
                          const loadout =
                            loadouts[employee.id] ?? emptyLoadout();
                          const equipped = isItemEquippedOnLoadout(
                            loadout,
                            selectedReward.id,
                          );
                          return (
                            <li
                              key={employee.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-white">
                                  {employee.name}
                                </p>
                                {equipped ? (
                                  <p className="text-[11px] text-white/40">
                                    On loadout
                                  </p>
                                ) : null}
                              </div>
                              <Button
                                type="button"
                                disabled={pending}
                                className={cn(
                                  "h-9 shrink-0 rounded-lg px-3.5 text-xs font-medium",
                                  equipped
                                    ? "border border-white/12 bg-transparent text-white/70 hover:bg-white/5"
                                    : "bg-white text-black hover:bg-white/90",
                                )}
                                onClick={() =>
                                  onEquip(employee.id, employee.name)
                                }
                              >
                                {equipped ? "Equipped" : "Equip"}
                              </Button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                    <p className="text-[11px] leading-relaxed text-white/35">
                      Full loadout editing lives on the employee → Customization.
                      Unequip = choose Default there.
                    </p>
                    <Button asChild className={rewardsSecondaryButtonClass}>
                      <Link href="/dashboard/employees">
                        Open Digital Employees
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/45">Select an item.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <h3 className="text-sm font-medium text-white">Loadouts</h3>
              <ul className="mt-4 space-y-3">
                {employees.length === 0 ? (
                  <li className="text-sm text-white/40">No employees yet.</li>
                ) : (
                  employees.slice(0, 5).map((employee) => {
                    const loadout = loadouts[employee.id] ?? emptyLoadout();
                    const equippedCount = [
                      loadout.appearanceId,
                      loadout.voiceId,
                      loadout.backgroundId,
                      loadout.idleId,
                      loadout.frameId,
                      ...loadout.skillChipIds,
                    ].filter(Boolean).length;
                    return (
                      <li
                        key={employee.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-white/85">
                            {employee.name}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {equippedCount} slots filled
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="shrink-0 text-[11px] text-white/45 hover:text-white"
                        >
                          Edit
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>

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
