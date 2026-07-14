"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Hexagon,
  Lock,
  Mic,
  Shirt,
  Sparkles,
  Square,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  type RewardType,
} from "@/features/rewards/lib/catalog";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
  rewardsWorkspaceClass,
} from "@/features/rewards/lib/workspace-shell";
import { CapsulesAmbienceToggle } from "@/features/capsules/components/capsules-ambience";

const FILTERS: Array<{
  id: "all" | RewardType | "soon";
  label: string;
  soon?: boolean;
}> = [
  { id: "all", label: "All Items" },
  { id: "skill_chip", label: "Skill Chips" },
  { id: "appearance", label: "Appearance" },
  { id: "voice", label: "Voice" },
  { id: "idle", label: "Idle", soon: true },
  { id: "background", label: "Background", soon: true },
  { id: "frame", label: "Frame", soon: true },
];

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

function typeLabel(type: RewardType): string {
  return REWARD_TYPE_LABELS[type];
}

export function InventoryScreen() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("item");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState(
    initialId && MOCK_REWARD_ITEMS.some((item) => item.id === initialId)
      ? initialId
      : (MOCK_REWARD_ITEMS[0]?.id ?? null),
  );
  const [employeeId, setEmployeeId] = useState<string>(
    MOCK_EMPLOYEE_TARGETS[0].id,
  );
  const [toast, setToast] = useState<string | null>(null);

  const items = useMemo(() => {
    if (filter === "all" || filter === "soon") {
      return MOCK_REWARD_ITEMS;
    }
    return MOCK_REWARD_ITEMS.filter((item) => item.type === filter);
  }, [filter]);

  const selected: RewardItem | null =
    items.find((item) => item.id === selectedId) ??
    MOCK_REWARD_ITEMS.find((item) => item.id === selectedId) ??
    null;

  const selectedStyle = selected ? RARITY_STYLES[selected.rarity] : null;

  return (
    <div className={rewardsWorkspaceClass()}>
      <div className="flex w-full flex-1 flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-[0.18em] text-white uppercase sm:text-3xl">
              Inventory
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Your collected items and rewards.
            </p>
          </div>
          <CapsulesAmbienceToggle />
        </header>

        {toast ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-white/8 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.soon}
                onClick={() => {
                  if (item.soon) return;
                  setFilter(item.id);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs tracking-wide transition-colors",
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
          <p className="text-xs text-white/35">Sort: Rarity</p>
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {items.map((item) => {
                const style = RARITY_STYLES[item.rarity];
                const Icon = typeIcon(item.type);
                const active = item.id === selected?.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "flex h-full min-h-48 w-full flex-col rounded-2xl border bg-[#1a1a1a] p-4 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#1f1f1f]",
                        style.border,
                        active && "ring-1 ring-white/30",
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
                      <div className="mt-4 flex flex-1 items-center justify-center">
                        <Icon className={cn("size-10", style.text)} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-end justify-between gap-2">
                        <p className="text-[11px] text-white/40">
                          {typeLabel(item.type)}
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
              <li>
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-[#161616] p-4 text-center text-xs text-white/35">
                  Stay tuned
                </div>
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/30">
              Showing 1–{items.length} of {MOCK_REWARD_ITEMS.length} items
            </p>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 xl:sticky xl:top-6 xl:self-start">
            {selected && selectedStyle ? (
              <>
                <div
                  className={cn(
                    "mx-auto flex size-32 items-center justify-center rounded-2xl border bg-black/40",
                    selectedStyle.border,
                  )}
                >
                  {(() => {
                    const Icon = typeIcon(selected.type);
                    return (
                      <Icon className={cn("size-14", selectedStyle.text)} />
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
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {selected.description}
                </p>

                <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Type</dt>
                    <dd className="text-white/80">{typeLabel(selected.type)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Rarity</dt>
                    <dd className={selectedStyle.text}>{selectedStyle.label}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Owned</dt>
                    <dd className="font-mono text-white/80">{selected.owned}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Compatible</dt>
                    <dd className="text-white/80">{selected.compatible}</dd>
                  </div>
                </dl>

                <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
                  <p className="text-xs text-white/40">Equip to employee</p>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger className="w-full rounded-xl border-white/12 bg-black/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_EMPLOYEE_TARGETS.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    className={rewardsPrimaryButtonClass}
                    onClick={() =>
                      setToast(
                        `Equip stub: ${selected.name} → ${
                          MOCK_EMPLOYEE_TARGETS.find((e) => e.id === employeeId)
                            ?.name ?? "employee"
                        }.`,
                      )
                    }
                  >
                    Equip item
                  </Button>
                  <Button
                    type="button"
                    className={rewardsSecondaryButtonClass}
                    onClick={() => setToast("Lock item — coming soon.")}
                  >
                    <Lock className="size-4" />
                    Lock item
                  </Button>
                  <p className="text-[11px] leading-relaxed text-white/35">
                    Equipping updates the employee card and preview. Anam visuals
                    come with asset packs.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/45">Select an item.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
