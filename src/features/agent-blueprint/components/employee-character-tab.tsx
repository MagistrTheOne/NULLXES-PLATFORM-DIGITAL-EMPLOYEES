"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InferSelectModel } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { upsertEmployeeCharacterAction } from "../actions/manage-blueprint";

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

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5 text-white">
      <div className="space-y-2">
        <Label>{t("preset")}</Label>
        <Select
          disabled={!canManage || pending}
          value={character?.presetId ?? ""}
          onValueChange={(presetId) =>
            startTransition(async () => {
              await upsertEmployeeCharacterAction({
                employeeId,
                presetId: presetId || null,
              });
            })
          }
        >
          <SelectTrigger className="border-white/10 bg-black text-white">
            <SelectValue placeholder={t("presetPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("compiledPrompt")}</Label>
        <Textarea
          readOnly
          value={character?.compiledPromptBlock ?? t("empty")}
          rows={10}
          className="border-white/10 bg-black text-white/80"
        />
      </div>

      {canManage ? (
        <Button
          type="button"
          variant="outline"
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
    </div>
  );
}
