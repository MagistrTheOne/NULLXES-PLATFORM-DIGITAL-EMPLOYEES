import { cn } from "@/lib/utils";
import type { CharacterTraits } from "@/entities/character-preset/types";

const TRAIT_KEYS: (keyof CharacterTraits)[] = [
  "formality",
  "empathy",
  "assertiveness",
  "verbosity",
];

export type TraitPoleLabels = Record<
  keyof CharacterTraits,
  { low: string; high: string; label: string }
>;

export function CharacterTraitBars({
  traits,
  poles,
  className,
}: {
  traits: CharacterTraits;
  poles: TraitPoleLabels;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {TRAIT_KEYS.map((key) => {
        const value = traits[key];
        const percent = Math.min(100, Math.max(0, (value / 5) * 100));
        const pole = poles[key];
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-white/70">{pole.label}</span>
              <span className="shrink-0 text-white/35">
                {pole.low} · {pole.high}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
