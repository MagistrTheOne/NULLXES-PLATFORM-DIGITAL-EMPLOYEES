import { cn } from "@/lib/utils";
import type { CharacterTraits } from "@/entities/character-preset/types";

const TRAIT_KEYS: (keyof CharacterTraits)[] = [
  "formality",
  "empathy",
  "assertiveness",
  "verbosity",
];

export function CharacterTraitBars({
  traits,
  labels,
  className,
}: {
  traits: CharacterTraits;
  labels: Record<keyof CharacterTraits, string>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {TRAIT_KEYS.map((key) => {
        const value = traits[key];
        const percent = Math.min(100, Math.max(0, (value / 5) * 100));
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">{labels[key]}</span>
              <span className="tabular-nums text-white/45">{value}/5</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
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
