"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  REWARD_TYPE_LABELS,
  type RewardItem,
  type RewardType,
} from "@/features/rewards/lib/catalog";
import {
  cloneLoadout,
  emptyLoadout,
  equippedSkillCount,
  loadoutsEqual,
  SKILL_SLOT_COUNT,
  type EmployeeLoadout,
} from "@/features/rewards/lib/loadout";
import { saveEmployeeLoadoutAction } from "@/features/rewards/actions/equip-reward";
import {
  rewardsPrimaryButtonClass,
  rewardsSecondaryButtonClass,
} from "@/features/rewards/lib/workspace-shell";

const DEFAULT_VALUE = "__default__";

type SlotKey = "appearance" | "voice" | "background" | "idle" | "frame";

function optionsForType(rewards: RewardItem[], type: RewardType) {
  return rewards.filter((item) => item.type === type && item.owned > 0);
}

function LoadoutSelect({
  label,
  value,
  type,
  rewards,
  onChange,
}: {
  label: string;
  value: string | null;
  type: RewardType;
  rewards: RewardItem[];
  onChange: (next: string | null) => void;
}) {
  const options = optionsForType(rewards, type);
  const current = rewards.find((item) => item.id === value) ?? null;

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
        <SelectTrigger className="mt-3 h-9 rounded-lg border-white/12 bg-black/40 text-white">
          <SelectValue placeholder="Default" />
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
  rewards,
  initialLoadout,
}: {
  employeeId: string;
  employeeName: string;
  rewards: RewardItem[];
  initialLoadout: EmployeeLoadout;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [applied, setApplied] = useState(() => cloneLoadout(initialLoadout));
  const [draft, setDraft] = useState(() => cloneLoadout(initialLoadout));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setApplied(cloneLoadout(initialLoadout));
    setDraft(cloneLoadout(initialLoadout));
  }, [employeeId, initialLoadout]);

  const dirty = useMemo(
    () => !loadoutsEqual(draft, applied),
    [draft, applied],
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
    startTransition(async () => {
      const result = await saveEmployeeLoadoutAction({
        employeeId,
        loadout: draft,
      });
      if (!result.ok) {
        setToast(result.message);
        return;
      }
      setApplied(cloneLoadout(draft));
      setToast(`Loadout applied for ${employeeName}.`);
      router.refresh();
    });
  }

  function onReset() {
    setDraft(cloneLoadout(applied));
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
          <Button asChild className={cn(rewardsSecondaryButtonClass, "w-auto")}>
            <Link href="/dashboard/inventory">Open Inventory</Link>
          </Button>
        </div>

        {toast ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {toast}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <LoadoutSelect
            label="Appearance"
            type="appearance"
            value={draft.appearanceId}
            rewards={rewards}
            onChange={(next) => patchSlot("appearance", next)}
          />
          <LoadoutSelect
            label="Voice"
            type="voice"
            value={draft.voiceId}
            rewards={rewards}
            onChange={(next) => patchSlot("voice", next)}
          />
          <LoadoutSelect
            label="Background"
            type="background"
            value={draft.backgroundId}
            rewards={rewards}
            onChange={(next) => patchSlot("background", next)}
          />
          <LoadoutSelect
            label="Idle"
            type="idle"
            value={draft.idleId}
            rewards={rewards}
            onChange={(next) => patchSlot("idle", next)}
          />
        </div>

        <div className="mt-5">
          <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
            Skill chips · {skillFilled}/{SKILL_SLOT_COUNT}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: SKILL_SLOT_COUNT }, (_, index) => {
              const value = draft.skillChipIds[index] ?? null;
              const options = optionsForType(rewards, "skill_chip");
              const current =
                rewards.find((item) => item.id === value) ?? null;
              return (
                <div
                  key={`skill-${index}`}
                  className="rounded-xl border border-white/8 bg-black/20 p-4"
                >
                  <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
                    Slot {index + 1}
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {current?.name ?? "Empty"}
                  </p>
                  <Select
                    value={value ?? DEFAULT_VALUE}
                    onValueChange={(next) =>
                      patchSkill(index, next === DEFAULT_VALUE ? null : next)
                    }
                  >
                    <SelectTrigger className="mt-3 h-9 rounded-lg border-white/12 bg-black/40 text-white">
                      <SelectValue placeholder="Empty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_VALUE}>Empty</SelectItem>
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!dirty || pending}
            onClick={onApply}
            className={cn(rewardsPrimaryButtonClass, "w-auto px-5")}
          >
            Apply
          </Button>
          <Button
            type="button"
            disabled={!dirty || pending}
            onClick={onReset}
            className={cn(rewardsSecondaryButtonClass, "w-auto px-5")}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmployeeCustomizationPanelFallback({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  return (
    <EmployeeCustomizationPanel
      employeeId={employeeId}
      employeeName={employeeName}
      rewards={[]}
      initialLoadout={emptyLoadout()}
    />
  );
}
