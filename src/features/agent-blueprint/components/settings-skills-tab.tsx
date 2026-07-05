"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsCard } from "@/features/settings/components/settings-card";
import type { InferSelectModel } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { createSkillAction, deleteSkillAction } from "../actions/manage-blueprint";

type SkillRow = InferSelectModel<typeof skill>;

type Props = {
  skills: SkillRow[];
  canManage: boolean;
};

export function SettingsSkillsTab({ skills, canManage }: Props) {
  const t = useTranslations("agentBlueprint.skills");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");

  function handleCreate() {
    if (!name.trim() || !instructions.trim()) return;
    startTransition(async () => {
      await createSkillAction({
        name: name.trim(),
        instructions: instructions.trim(),
      });
      setName("");
      setInstructions("");
    });
  }

  return (
    <div className="space-y-6">
      <SettingsCard title={t("title")} description={t("description")}>
        <ul className="divide-y divide-border">
          {skills.map((skill) => (
            <li
              key={skill.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{skill.name}</p>
                <p className="text-sm text-muted-foreground">
                  {skill.slug} · {skill.category}
                  {skill.isSystemTemplate ? ` · ${t("systemTemplate")}` : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {skill.instructions}
                </p>
              </div>
              {canManage && !skill.isSystemTemplate ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteSkillAction(skill.id);
                    })
                  }
                >
                  {t("delete")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsCard>

      {canManage ? (
        <SettingsCard title={t("createTitle")} description={t("createDescription")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">{t("name")}</Label>
              <Input id="skill-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-instructions">{t("instructions")}</Label>
              <Textarea
                id="skill-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
              />
            </div>
            <Button
              type="button"
              disabled={pending || !name.trim() || !instructions.trim()}
              onClick={handleCreate}
            >
              {t("create")}
            </Button>
          </div>
        </SettingsCard>
      ) : null}
    </div>
  );
}
