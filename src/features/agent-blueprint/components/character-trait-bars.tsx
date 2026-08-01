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
    <div className={cn("space-y-4", className)}>
      {TRAIT_KEYS.map((key) => {
        const value = traits[key];
        const percent = Math.min(100, Math.max(0, (value / 5) * 100));
        const pole = poles[key];
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">{pole.label}</span>
              <span className="text-white/40">
                {value <= 2 ? pole.low : value >= 4 ? pole.high : "—"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{pole.low}</span>
              <span>{pole.high}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
