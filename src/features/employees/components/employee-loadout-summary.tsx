"use client";

import { resolveSlotReward, emptyLoadout } from "@/features/rewards/lib/loadout";
import { useLoadoutStore } from "@/features/rewards/lib/use-loadout-store";

/** Shows applied mock loadout under the employee preview (after Apply / Equip). */
export function EmployeeLoadoutSummary({ employeeId }: { employeeId: string }) {
  const store = useLoadoutStore();
  const loadout = store.loadouts[employeeId] ?? emptyLoadout();
  const appearance = resolveSlotReward(loadout.appearanceId);
  const voice = resolveSlotReward(loadout.voiceId);
  const skills = loadout.skillChipIds
    .map((id) => resolveSlotReward(id))
    .filter(Boolean);

  if (!appearance && !voice && skills.length === 0) {
    return (
      <p className="text-xs text-white/35">Loadout: Default</p>
    );
  }

  return (
    <div className="space-y-1 text-xs text-white/55">
      {appearance ? (
        <p>
          <span className="text-white/35">Outfit · </span>
          {appearance.name}
        </p>
      ) : null}
      {voice ? (
        <p>
          <span className="text-white/35">Voice · </span>
          {voice.name}
        </p>
      ) : null}
      {skills.length > 0 ? (
        <p>
          <span className="text-white/35">Skills · </span>
          {skills.map((s) => s!.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
