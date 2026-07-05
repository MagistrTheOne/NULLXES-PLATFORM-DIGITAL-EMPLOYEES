"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/features/settings/components/settings-card";
import type { InferSelectModel } from "drizzle-orm";
import { toolDefinition } from "@/entities/tool-definition/schema";

type ToolDefinitionRow = InferSelectModel<typeof toolDefinition>;

type Props = {
  tools: ToolDefinitionRow[];
};

export function SettingsToolsTab({ tools }: Props) {
  const t = useTranslations("agentBlueprint.tools");

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <ul className="divide-y divide-border">
        {tools.map((tool) => (
          <li key={tool.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{tool.name}</p>
              <Badge variant="outline">{tool.slug}</Badge>
              <Badge variant="secondary">{tool.riskLevel}</Badge>
              {tool.requiresApproval ? (
                <Badge variant="destructive">{t("requiresApproval")}</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
