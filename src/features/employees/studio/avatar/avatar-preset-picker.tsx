"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listStudioAvatarPresets } from "./list-studio-avatar-presets";
import type { StudioAvatarPreset } from "./avatar-preset-catalog";

export function AvatarPresetPicker({
  selectedPresetId,
  disabled,
  onSelectPreset,
}: {
  selectedPresetId: string | null;
  disabled?: boolean;
  onSelectPreset: (preset: StudioAvatarPreset) => void;
}) {
  const t = useTranslations("employees.studio.avatar");
  const [presets, setPresets] = useState<StudioAvatarPreset[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void listStudioAvatarPresets()
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setPresets(result.presets);
          setLoadError(null);
          return;
        }

        setLoadError(result.message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 py-16 text-sm text-white/50">
        <Loader2 className="size-4 animate-spin" />
        {t("presetsLoading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
        {loadError}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {presets.map((preset) => {
        const isSelected = selectedPresetId === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPreset(preset)}
            className={cn(
              "group flex flex-col overflow-hidden rounded-xl border text-start transition-colors",
              isSelected
                ? "border-white/30 bg-white/8"
                : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.imageUrl}
                alt={preset.name}
                className="size-full object-cover"
              />
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white">{preset.name}</p>
              <p className="mt-1 text-xs text-white/50">{preset.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
