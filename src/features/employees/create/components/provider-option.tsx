import { cn } from "@/lib/utils";

export function ProviderOption<T extends string>({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected
          ? "border-white/30 bg-white/[0.08] text-white"
          : "border-white/10 bg-[#111111] text-white/70 hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      {label}
    </button>
  );
}
