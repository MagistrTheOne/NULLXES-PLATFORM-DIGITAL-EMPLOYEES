"use client";

import { useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { mergeCharacterTraits } from "../lib/compile-character-prompt";
import { upsertEmployeeCharacterAction } from "../actions/manage-blueprint";
import { CharacterTraitBars } from "./character-trait-bars";

type CharacterPresetRow = InferSelectModel<typeof characterPreset>;
type EmployeeCharacterRow = InferSelectModel<typeof employeeCharacter>;

type Props = {
  organizationId: string;
  employeeId: string;
  presets: CharacterPresetRow[];
  character: EmployeeCharacterRow | null;
  canManage: boolean;
  isPlatformAdmin?: boolean;
};

export function EmployeeCharacterTab({
  employeeId,
  presets,
  character,
  canManage,
  isPlatformAdmin = false,
}: Props) {
  const t = useTranslations("agentBlueprint.employeeCharacter");
  const [pending, startTransition] = useTransition();

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === character?.presetId) ?? null,
    [character?.presetId, presets],
  );

  const mergedTraits = useMemo(() => {
    if (!activePreset) {
      return null;
    }
    return mergeCharacterTraits(
      activePreset.traits,
      character?.traitOverrides ?? undefined,
    );
  }, [activePreset, character?.traitOverrides]);

  const poles = {
    formality: {
      label: t("traits.formality"),
      low: t("traitPoles.formalityLow"),
      high: t("traitPoles.formalityHigh"),
    },
    empathy: {
      label: t("traits.empathy"),
      low: t("traitPoles.empathyLow"),
      high: t("traitPoles.empathyHigh"),
    },
    assertiveness: {
      label: t("traits.assertiveness"),
      low: t("traitPoles.assertivenessLow"),
      high: t("traitPoles.assertivenessHigh"),
    },
    verbosity: {
      label: t("traits.verbosity"),
      low: t("traitPoles.verbosityLow"),
      high: t("traitPoles.verbosityHigh"),
    },
  };

  function presetCopy(preset: CharacterPresetRow) {
    const titleKey = `catalog.${preset.slug}.title` as const;
    const blurbKey = `catalog.${preset.slug}.blurb` as const;
    return {
      title: t.has(titleKey) ? t(titleKey) : preset.name,
      blurb: t.has(blurbKey)
        ? t(blurbKey)
        : (preset.description?.trim() ?? ""),
    };
  }

  return (
    <div className="space-y-4 text-white">
      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-medium text-white/85">{t("preset")}</h3>
          <p className="mt-1 text-sm text-white/45">{t("presetHint")}</p>
        </div>
        {presets.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/50">
            {t("noPresets")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
            {presets.map((preset, index) => {
              const selected = character?.presetId === preset.id;
              const { title, blurb } = presetCopy(preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!canManage || pending}
                  onClick={() =>
                    startTransition(async () => {
                      await upsertEmployeeCharacterAction({
                        employeeId,
                        presetId: preset.id,
                      });
                    })
                  }
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors",
                    index > 0 && "border-t border-white/8",
                    selected ? "bg-white/6" : "hover:bg-white/4",
                    (!canManage || pending) && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-white bg-white text-black"
                        : "border-white/25 text-transparent",
                    )}
                  >
                    <Check className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">
                      {title}
                    </span>
                    {blurb ? (
                      <span className="mt-0.5 block line-clamp-1 text-sm text-white/45">
                        {blurb}
                      </span>
                    ) : null}
                    {isPlatformAdmin ? (
                      <span className="mt-1 block font-mono text-[10px] text-white/30">
                        {preset.slug}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {activePreset && mergedTraits ? (
        <>
          <section className="rounded-xl border border-white/10 bg-[#111111] p-4">
            <h3 className="text-sm font-medium text-white/85">{t("traitsTitle")}</h3>
            <p className="mt-1 text-sm text-white/45">{t("traitsHint")}</p>
            <div className="mt-3">
              <CharacterTraitBars traits={mergedTraits} poles={poles} />
            </div>
          </section>

          <Collapsible className="rounded-xl border border-white/10 bg-[#111111]">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-medium text-white/85 hover:bg-white/4 [&[data-state=open]>svg]:rotate-180">
              {t("principlesTitle")}
              <ChevronDown className="size-4 shrink-0 text-white/40 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-white/8 px-4 py-3">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/45">{t("opening")}</p>
                  <p className="mt-1 text-white/80">
                    {activePreset.speechStyle.openingBehavior}
                  </p>
                </div>
                <div>
                  <p className="text-white/45">{t("closing")}</p>
                  <p className="mt-1 text-white/80">
                    {activePreset.speechStyle.closingBehavior}
                  </p>
                </div>
                {activePreset.boundaries?.trim() ? (
                  <div>
                    <p className="text-white/45">{t("boundaries")}</p>
                    <p className="mt-1 text-white/80">
                      {activePreset.boundaries}
                    </p>
                  </div>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-4 py-6 text-center text-sm text-white/50">
          {t("empty")}
        </p>
      )}

      {isPlatformAdmin ? (
        <Collapsible className="rounded-xl border border-white/10 bg-[#111111]">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-medium text-white/85 hover:bg-white/4 [&[data-state=open]>svg]:rotate-180">
            {t("compiledPrompt")}
            <ChevronDown className="size-4 shrink-0 text-white/40 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-white/8 px-4 py-3">
            <Textarea
              readOnly
              value={character?.compiledPromptBlock ?? t("empty")}
              rows={6}
              className="border-white/10 bg-black text-white/80"
            />
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await upsertEmployeeCharacterAction({
                      employeeId,
                      presetId: character?.presetId ?? null,
                      customPromptBlock: character?.customPromptBlock ?? null,
                    });
                  })
                }
              >
                {t("refresh")}
              </Button>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
