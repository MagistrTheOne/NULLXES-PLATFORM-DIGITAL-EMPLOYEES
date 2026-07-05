"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsCard } from "@/features/settings/components/settings-card";
import type { InferSelectModel } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import {
  createCharacterPresetAction,
  deleteCharacterPresetAction,
  duplicateCharacterPresetAction,
} from "../actions/manage-blueprint";

type CharacterPresetRow = InferSelectModel<typeof characterPreset>;

type Props = {
  presets: CharacterPresetRow[];
  canManage: boolean;
};

const DEFAULT_TRAITS = {
  formality: 3,
  empathy: 3,
  assertiveness: 3,
  verbosity: 3,
};

export function SettingsCharactersTab({ presets, canManage }: Props) {
  const t = useTranslations("agentBlueprint.characters");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createCharacterPresetAction({
        name: name.trim(),
        description: description.trim() || undefined,
        traits: DEFAULT_TRAITS,
        speechStyle: {
          openingBehavior: "Acknowledge the user briefly.",
          closingBehavior: "Confirm next steps when relevant.",
          catchphrases: [],
        },
      });
      setName("");
      setDescription("");
    });
  }

  return (
    <div className="space-y-6">
      <SettingsCard title={t("title")} description={t("description")}>
        <ul className="divide-y divide-border">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{preset.name}</p>
                <p className="text-sm text-muted-foreground">
                  {preset.slug}
                  {preset.isSystemTemplate ? ` · ${t("systemTemplate")}` : ""}
                </p>
                {preset.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {preset.description}
                  </p>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  {preset.isSystemTemplate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await duplicateCharacterPresetAction({
                            sourcePresetId: preset.id,
                          });
                        })
                      }
                    >
                      {t("duplicate")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteCharacterPresetAction(preset.id);
                        })
                      }
                    >
                      {t("delete")}
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsCard>

      {canManage ? (
        <SettingsCard title={t("createTitle")} description={t("createDescription")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="character-name">{t("name")}</Label>
              <Input
                id="character-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="character-description">{t("descriptionLabel")}</Label>
              <Textarea
                id="character-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="button" disabled={pending || !name.trim()} onClick={handleCreate}>
              {t("create")}
            </Button>
          </div>
        </SettingsCard>
      ) : null}
    </div>
  );
}
