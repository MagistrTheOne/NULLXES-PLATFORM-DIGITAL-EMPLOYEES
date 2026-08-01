"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SettingsCard } from "@/features/settings/components/settings-card";
import type { InferSelectModel } from "drizzle-orm";
import { toolDefinition } from "@/entities/tool-definition/schema";

type ToolDefinitionRow = InferSelectModel<typeof toolDefinition>;

type Props = {
  tools: ToolDefinitionRow[];
};

export function SettingsToolsTab({ tools }: Props) {
  const t = useTranslations("agentBlueprint.tools");
  const tEmployee = useTranslations("agentBlueprint.employeeTools");

  const groups = useMemo(() => {
    const mapped = tools.map((tool) => {
      const titleKey = `catalog.${tool.slug}.title` as const;
      const blurbKey = `catalog.${tool.slug}.blurb` as const;
      return {
        tool,
        title: tEmployee.has(titleKey)
          ? tEmployee(titleKey)
          : tool.name.replace(/_/g, " "),
        blurb: tEmployee.has(blurbKey)
          ? tEmployee(blurbKey)
          : tool.description,
        group: tool.requiresApproval
          ? ("approval" as const)
          : tool.riskLevel === "write" || tool.riskLevel === "destructive"
            ? ("write" as const)
            : ("read" as const),
      };
    });

    return {
      read: mapped.filter((item) => item.group === "read"),
      write: mapped.filter((item) => item.group === "write"),
      approval: mapped.filter((item) => item.group === "approval"),
    };
  }, [tools, tEmployee]);

  function renderGroup(
    title: string,
    items: Array<{
      tool: ToolDefinitionRow;
      title: string;
      blurb: string;
    }>,
  ) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map(({ tool, title: name, blurb }) => (
            <li key={tool.id} className="px-4 py-3">
              <p className="font-medium text-foreground">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <div className="space-y-6">
        {renderGroup(t("groupRead"), groups.read)}
        {renderGroup(t("groupWrite"), groups.write)}
        {renderGroup(t("groupApproval"), groups.approval)}
      </div>
    </SettingsCard>
  );
}
