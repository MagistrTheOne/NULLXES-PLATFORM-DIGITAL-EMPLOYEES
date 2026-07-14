"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  MOCK_EMPLOYEE_TARGETS,
  MOCK_REWARD_ITEMS,
  RARITY_STYLES,
  REWARD_TYPE_LABELS,
  type RewardItem,
  type RewardRarity,
  type RewardType,
} from "@/features/rewards/lib/catalog";
import {
  emptyLoadout,
  isItemEquippedAnywhere,
  isItemEquippedOnLoadout,
  resolveSlotReward,
} from "@/features/rewards/lib/loadout";
import {
  equipItemOnEmployee,
  toggleFavorite,
  useLoadoutStore,
} from "@/features/rewards/lib/use-loadout-store";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "@/features/capsules/components/capsules-ambience";

const TYPE_FILTERS: Array<{
  id: "all" | "equipped" | RewardType;
  label: string;
  soon?: boolean;
}> = [
  { id: "all", label: "All Items" },
  { id: "equipped", label: "Equipped" },
  { id: "skill_chip", label: "Skill Chips" },
  { id: "appearance", label: "Appearance" },
  { id: "voice", label: "Voice" },
  { id: "idle", label: "Idle", soon: true },
  { id: "background", label: "Background", soon: true },
  { id: "frame", label: "Frame", soon: true },
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

function formatAgo(at: number): string {
  const delta = Math.max(0, Date.now() - at);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function InventoryScreen() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("item");
  const store = useLoadoutStore();
  const [filter, setFilter] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");
  const [sort, setSort] = useState<SortId>("rarity");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    initialId && MOCK_REWARD_ITEMS.some((item) => item.id === initialId)
      ? initialId
      : (MOCK_REWARD_ITEMS[0]?.id ?? null),
  );
  const [toast, setToast] = useState<string | null>(null);

  const items = useMemo(() => {
    let list = [...MOCK_REWARD_ITEMS];

    if (filter === "equipped") {
      list = list.filter((item) =>
        isItemEquippedAnywhere(store.loadouts, item.id),
      );
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
            MOCK_REWARD_ITEMS.findIndex((i) => i.id === a.id) -
            MOCK_REWARD_ITEMS.findIndex((i) => i.id === b.id)
          );
        case "duplicates":
          return b.owned - a.owned || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
        case "equipped": {
          const ae = isItemEquippedAnywhere(store.loadouts, a.id) ? 1 : 0;
          const be = isItemEquippedAnywhere(store.loadouts, b.id) ? 1 : 0;
          return be - ae || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
        }
        case "recent": {
          const ar = store.recent.findIndex((e) => e.itemId === a.id);
          const br = store.recent.findIndex((e) => e.itemId === b.id);
          const aRank = ar === -1 ? 999 : ar;
          const bRank = br === -1 ? 999 : br;
          return aRank - bRank;
        }
        case "rarity":
        default:
          return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
      }
    });

    return list;
  }, [filter, query, sort, store.loadouts, store.recent]);

  const selected: RewardItem | null =
    items.find((item) => item.id === selectedId) ??
    MOCK_REWARD_ITEMS.find((item) => item.id === selectedId) ??
    null;

  const selectedStyle = selected ? RARITY_STYLES[selected.rarity] : null;
  const isFavorite = selected ? Boolean(store.favorites[selected.id]) : false;

  function onEquip(employeeId: string, employeeName: string) {
    if (!selected) return;
    const result = equipItemOnEmployee({
      employeeId,
      employeeName,
      itemId: selected.id,
    });
    if (!result.ok) {
      setToast(result.message);
      return;
    }
    setToast(`${selected.name} → ${employeeName}. Open employee Customization to refine loadout.`);
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
              Reward library. Equip shortcuts apply to a digital employee loadout.
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
                  disabled={item.soon}
                  onClick={() => {
                    if (item.soon) return;
                    setFilter(item.id);
                  }}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs tracking-wide transition-colors",
                    filter === item.id
                      ? "bg-white text-black"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80",
                    item.soon && "cursor-not-allowed opacity-40",
                  )}
                >
                  {item.label}
                  {item.soon ? " (Soon)" : ""}
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
              {items.map((item) => {
                const style = RARITY_STYLES[item.rarity];
                const Icon = typeIcon(item.type);
                const active = item.id === selected?.id;
                const equipped = isItemEquippedAnywhere(store.loadouts, item.id);
                const favorite = Boolean(store.favorites[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
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
              <li>
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-[#161616] p-4 text-center text-xs text-white/35">
                  More items coming soon
                </div>
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/30">
              Showing 1–{items.length} of {MOCK_REWARD_ITEMS.length} items
            </p>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              {selected && selectedStyle ? (
                <>
                  <div
                    className={cn(
                      "mx-auto flex size-28 items-center justify-center rounded-2xl border bg-black/40",
                      selectedStyle.border,
                    )}
                  >
                    {(() => {
                      const Icon = typeIcon(selected.type);
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
                    {selected.name}
                  </h2>
                  <p className="mt-2 text-center text-[11px] text-white/40">
                    Preview · {REWARD_TYPE_LABELS[selected.type]}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {selected.description}
                  </p>

                  <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/40">Owned</dt>
                      <dd className="font-mono text-white/80">×{selected.owned}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/40">Compatible</dt>
                      <dd className="text-white/80">{selected.compatible}</dd>
                    </div>
                  </dl>

                  <Button
                    type="button"
                    className={cn("mt-4", rewardsSecondaryButtonClass)}
                    onClick={() => {
                      toggleFavorite(selected.id);
                      setToast(
                        isFavorite
                          ? `Removed ${selected.name} from favorites.`
                          : `Favorited ${selected.name}.`,
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
                      {MOCK_EMPLOYEE_TARGETS.map((employee) => {
                        const loadout =
                          store.loadouts[employee.id] ?? emptyLoadout();
                        const equipped = isItemEquippedOnLoadout(
                          loadout,
                          selected.id,
                        );
                        return (
                          <li
                            key={employee.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">
                                {employee.name}
                              </p>
                              {equipped ? (
                                <p className="text-[11px] text-white/40">
                                  Equipped
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              className={cn(
                                "h-8 w-auto shrink-0 rounded-lg px-3 text-xs",
                                equipped
                                  ? rewardsSecondaryButtonClass
                                  : rewardsPrimaryButtonClass,
                              )}
                              onClick={() =>
                                onEquip(employee.id, employee.name)
                              }
                            >
                              {equipped ? "Equipped" : "Equip"}
                            </Button>
                          </li>
                        );
                      })}
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
              <h3 className="text-sm font-medium text-white">Recently Equipped</h3>
              <ul className="mt-4 space-y-3">
                {store.recent.length === 0 ? (
                  <li className="text-sm text-white/40">No recent equips.</li>
                ) : (
                  store.recent.slice(0, 5).map((event) => {
                    const reward = resolveSlotReward(event.itemId);
                    return (
                      <li
                        key={`${event.itemId}-${event.at}`}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-white/85">
                            {reward?.name ?? event.itemId}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {event.employeeName}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-white/35">
                          {formatAgo(event.at)}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
