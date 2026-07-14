"use client";

import { getRewardById, type RewardItem } from "@/features/rewards/lib/catalog";
import {
  emptyLoadout,
  type EmployeeLoadout,
} from "@/features/rewards/lib/loadout";

/** Shows applied DB loadout under the employee preview. */
export function EmployeeLoadoutSummary({
  loadout = emptyLoadout(),
  rewards = [],
}: {
  employeeId?: string;
  loadout?: EmployeeLoadout;
  rewards?: RewardItem[];
}) {
  const appearance = getRewardById(loadout.appearanceId ?? "", rewards);
  const voice = getRewardById(loadout.voiceId ?? "", rewards);
  const skills = loadout.skillChipIds
    .map((id) => (id ? getRewardById(id, rewards) : undefined))
    .filter(Boolean);

  if (!appearance && !voice && skills.length === 0) {
    return <p className="text-xs text-white/35">Loadout: Default</p>;
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
