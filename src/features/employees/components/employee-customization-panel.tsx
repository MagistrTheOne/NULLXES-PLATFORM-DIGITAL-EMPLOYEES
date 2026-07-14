"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  MOCK_REWARD_ITEMS,
  REWARD_TYPE_LABELS,
  type RewardType,
} from "@/features/rewards/lib/catalog";
import {
  cloneLoadout,
  emptyLoadout,
  equippedSkillCount,
  loadoutsEqual,
  resolveSlotReward,
  SKILL_SLOT_COUNT,
  type EmployeeLoadout,
} from "@/features/rewards/lib/loadout";
import {
  ensureEmployeeLoadout,
  setEmployeeLoadout,
  useLoadoutStore,
} from "@/features/rewards/lib/use-loadout-store";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
} from "@/features/rewards/lib/workspace-shell";

const DEFAULT_VALUE = "__default__";

type SlotKey = "appearance" | "voice" | "background" | "idle" | "frame";

function optionsForType(type: RewardType) {
  return MOCK_REWARD_ITEMS.filter((item) => item.type === type && item.owned > 0);
}

function LoadoutSelect({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string | null;
  type: RewardType;
  onChange: (next: string | null) => void;
}) {
  const options = optionsForType(type);
  const current = resolveSlotReward(value);

  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {label}
          </p>
          <p className="mt-1 text-sm text-white">
            {current?.name ?? "Default"}
          </p>
          {current ? (
            <p className="mt-0.5 text-[11px] text-white/40">
              {REWARD_TYPE_LABELS[current.type]}
              {current.boostLabel ? ` · ${current.boostLabel}` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-white/35">Baseline look</p>
          )}
        </div>
      </div>
      <Select
        value={value ?? DEFAULT_VALUE}
        onValueChange={(next) =>
          onChange(next === DEFAULT_VALUE ? null : next)
        }
      >
        <SelectTrigger className="mt-3 w-full rounded-xl border-white/12 bg-[#111] text-white">
          <SelectValue placeholder="Change" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_VALUE}>Default</SelectItem>
          {options.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EmployeeCustomizationPanel({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const store = useLoadoutStore();
  const applied = store.loadouts[employeeId] ?? emptyLoadout();
  const [draft, setDraft] = useState<EmployeeLoadout>(() =>
    cloneLoadout(applied),
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    ensureEmployeeLoadout(employeeId);
  }, [employeeId]);

  useEffect(() => {
    setDraft(cloneLoadout(store.loadouts[employeeId] ?? emptyLoadout()));
  }, [employeeId, store.loadouts]);

  const dirty = useMemo(
    () => !loadoutsEqual(draft, store.loadouts[employeeId] ?? emptyLoadout()),
    [draft, employeeId, store.loadouts],
  );

  const skillFilled = equippedSkillCount(draft);

  function patchSlot(key: SlotKey, next: string | null) {
    setDraft((prev) => {
      switch (key) {
        case "appearance":
          return { ...prev, appearanceId: next };
        case "voice":
          return { ...prev, voiceId: next };
        case "background":
          return { ...prev, backgroundId: next };
        case "idle":
          return { ...prev, idleId: next };
        case "frame":
          return { ...prev, frameId: next };
        default:
          return prev;
      }
    });
  }

  function patchSkill(index: number, next: string | null) {
    setDraft((prev) => {
      const skillChipIds = [...prev.skillChipIds];
      skillChipIds[index] = next;
      return { ...prev, skillChipIds };
    });
  }

  function onApply() {
    setEmployeeLoadout(employeeId, draft);
    setToast(
      `Loadout applied for ${employeeName}. Employee card preview updates with asset packs later.`,
    );
  }

  function onReset() {
    setDraft(cloneLoadout(store.loadouts[employeeId] ?? emptyLoadout()));
    setToast(null);
  }

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-medium text-white">Current Loadout</h3>
            <p className="mt-1 text-sm text-white/50">
              Customize {employeeName}. Unequip by choosing Default, then Apply.
            </p>
          </div>
          <Link
            href="/dashboard/inventory"
            className="text-xs text-white/45 hover:text-white/80"
          >
            Open inventory library →
          </Link>
        </div>

        {toast ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <LoadoutSelect
            label="Appearance"
            type="appearance"
            value={draft.appearanceId}
            onChange={(next) => patchSlot("appearance", next)}
          />
          <LoadoutSelect
            label="Voice"
            type="voice"
            value={draft.voiceId}
            onChange={(next) => patchSlot("voice", next)}
          />
          <LoadoutSelect
            label="Background"
            type="background"
            value={draft.backgroundId}
            onChange={(next) => patchSlot("background", next)}
          />
          <LoadoutSelect
            label="Idle"
            type="idle"
            value={draft.idleId}
            onChange={(next) => patchSlot("idle", next)}
          />
        </div>

        <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
                Skill Slots
              </p>
              <p className="mt-1 text-sm text-white">
                {skillFilled} / {SKILL_SLOT_COUNT} Equipped
              </p>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: SKILL_SLOT_COUNT }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "size-2.5 rounded-full border border-white/20",
                    draft.skillChipIds[index]
                      ? "bg-white"
                      : "bg-transparent",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {draft.skillChipIds.map((chipId, index) => {
              const options = optionsForType("skill_chip").filter(
                (item) =>
                  item.id === chipId ||
                  !draft.skillChipIds.includes(item.id),
              );
              const current = resolveSlotReward(chipId);
              return (
                <div key={index} className="space-y-2">
                  <p className="text-[11px] text-white/40">
                    Skill Chip {index + 1}
                    {current?.boostLabel ? ` · ${current.boostLabel}` : ""}
                  </p>
                  <Select
                    value={chipId ?? DEFAULT_VALUE}
                    onValueChange={(next) =>
                      patchSkill(index, next === DEFAULT_VALUE ? null : next)
                    }
                  >
                    <SelectTrigger className="w-full rounded-xl border-white/12 bg-[#111] text-white">
                      <SelectValue placeholder="Empty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_VALUE}>Empty / Default</SelectItem>
                      {options.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            disabled={!dirty}
            className={rewardsPrimaryButtonClass}
            onClick={onApply}
          >
            Apply Changes
          </Button>
          <Button
            type="button"
            disabled={!dirty}
            className={rewardsSecondaryButtonClass}
            onClick={onReset}
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
