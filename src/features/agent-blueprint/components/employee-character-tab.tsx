"use client";

import { useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
};

export function EmployeeCharacterTab({
  employeeId,
  presets,
  character,
  canManage,
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

  const traitLabels = {
    formality: t("traits.formality"),
    empathy: t("traits.empathy"),
    assertiveness: t("traits.assertiveness"),
    verbosity: t("traits.verbosity"),
  };

  return (
    <div className="space-y-6 text-white">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-white/85">{t("preset")}</h3>
          <p className="mt-1 text-sm text-white/45">{t("presetHint")}</p>
        </div>
        {presets.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#111111] p-5 text-sm text-white/50">
            {t("noPresets")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => {
              const selected = character?.presetId === preset.id;
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
                    "group relative rounded-xl border p-4 text-start transition-colors",
                    "border-white/10 bg-[#111111] hover:border-white/20",
                    selected && "border-white/35 ring-1 ring-white/20",
                    (!canManage || pending) && "cursor-default opacity-90",
                  )}
                >
                  {selected ? (
                    <span className="absolute end-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-white text-black">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                  <p className="pe-8 font-medium">{preset.name}</p>
                  {preset.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-white/50">
                      {preset.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="border-white/10 text-white/60">
                      {preset.slug}
                    </Badge>
                    {preset.isSystemTemplate ? (
                      <Badge variant="secondary">{t("systemTemplate")}</Badge>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {activePreset && mergedTraits ? (
        <>
          <section className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <h3 className="text-sm font-medium text-white/85">{t("traitsTitle")}</h3>
            <p className="mt-1 text-sm text-white/45">{t("traitsHint")}</p>
            <div className="mt-4">
              <CharacterTraitBars traits={mergedTraits} labels={traitLabels} />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <h3 className="text-sm font-medium text-white/85">{t("principlesTitle")}</h3>
            <div className="mt-4 space-y-4 text-sm">
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
              {activePreset.speechStyle.catchphrases.length > 0 ? (
                <div>
                  <p className="text-white/45">{t("catchphrases")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activePreset.speechStyle.catchphrases.map((phrase) => (
                      <Badge
                        key={phrase}
                        variant="outline"
                        className="border-white/10 text-white/70"
                      >
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {activePreset.boundaries?.trim() ? (
                <div>
                  <p className="text-white/45">{t("boundaries")}</p>
                  <p className="mt-1 text-white/80">{activePreset.boundaries}</p>
                </div>
              ) : null}
              <div>
                <p className="text-white/45">{t("languagePolicy")}</p>
                <p className="mt-1 capitalize text-white/80">
                  {activePreset.languagePolicy}
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-5 py-8 text-center text-sm text-white/50">
          {t("empty")}
        </p>
      )}

      <section className="rounded-xl border border-white/10 bg-[#111111] p-5">
        <h3 className="text-sm font-medium text-white/85">{t("compiledPrompt")}</h3>
        <Textarea
          readOnly
          value={character?.compiledPromptBlock ?? t("empty")}
          rows={8}
          className="mt-3 border-white/10 bg-black text-white/80"
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
      </section>
    </div>
  );
}
