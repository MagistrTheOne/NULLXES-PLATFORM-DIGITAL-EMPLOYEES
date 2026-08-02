"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { syncEmployeeToolAction } from "../actions/manage-blueprint";
import {
  CatalogTogglePanel,
  CatalogToggleRow,
  type CatalogFilterId,
} from "./catalog-toggle-panel";

type ToolRow = {
  toolDefinitionId: string;
  slug: string;
  name: string;
  description: string;
  riskLevel: string;
  requiresApproval: boolean;
  isEnabled: boolean;
};

type Props = {
  employeeId: string;
  tools: ToolRow[];
  canManage: boolean;
  isPlatformAdmin?: boolean;
};

type OptimisticToggle = { toolDefinitionId: string; isEnabled: boolean };

export function EmployeeToolsTab({
  employeeId,
  tools,
  canManage,
  isPlatformAdmin = false,
}: Props) {
  const t = useTranslations("agentBlueprint.employeeTools");
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<CatalogFilterId>("all");
  const [optimisticTools, setOptimistic] = useOptimistic(
    tools,
    (state, update: OptimisticToggle) =>
      state.map((tool) =>
        tool.toolDefinitionId === update.toolDefinitionId
          ? { ...tool, isEnabled: update.isEnabled }
          : tool,
      ),
  );

  const rows = useMemo(() => {
    return [...optimisticTools]
      .map((tool) => {
        const titleKey = `catalog.${tool.slug}.title` as const;
        const blurbKey = `catalog.${tool.slug}.blurb` as const;
        const title = t.has(titleKey)
          ? t(titleKey)
          : tool.name.replace(/_/g, " ");
        const blurb = t.has(blurbKey) ? t(blurbKey) : tool.description.trim();
        return { tool, title, blurb };
      })
      .sort((a, b) => {
        if (a.tool.isEnabled !== b.tool.isEnabled) {
          return a.tool.isEnabled ? -1 : 1;
        }
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      });
  }, [optimisticTools, t]);

  const visible = rows.filter((item) => {
    if (filter === "on") return item.tool.isEnabled;
    if (filter === "off") return !item.tool.isEnabled;
    return true;
  });

  const enabledCount = rows.filter((item) => item.tool.isEnabled).length;
  const totalCount = rows.length;

  function toggleTool(toolDefinitionId: string, isEnabled: boolean) {
    if (!canManage || pending) return;
    startTransition(async () => {
      setOptimistic({ toolDefinitionId, isEnabled });
      await syncEmployeeToolAction({
        employeeId,
        toolDefinitionId,
        isEnabled,
      });
    });
  }

  return (
    <CatalogTogglePanel
      filter={filter}
      onFilterChange={setFilter}
      filters={[
        { id: "all", label: t("filterAll") },
        { id: "on", label: t("filterOn") },
        { id: "off", label: t("filterOff") },
      ]}
      countLabel={
        <>
          <span className="text-sm font-semibold text-white">{enabledCount}</span>
          <span className="mx-1 text-white/20">/</span>
          <span>{totalCount}</span>
          <span className="ml-1.5 text-white/35">{t("activeLabel")}</span>
        </>
      }
      empty={
        visible.length === 0
          ? totalCount === 0
            ? t("empty")
            : t("emptyFilter")
          : null
      }
    >
      {visible.map(({ tool, title, blurb }) => (
        <CatalogToggleRow
          key={tool.toolDefinitionId}
          title={title}
          blurb={blurb}
          enabled={tool.isEnabled}
          disabled={!canManage || pending}
          tooltip={isPlatformAdmin ? tool.slug : blurb || undefined}
          badge={
            tool.requiresApproval ? (
              <span className="shrink-0 rounded border border-white/12 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/40">
                {t("approvalShort")}
              </span>
            ) : undefined
          }
          onToggle={() => toggleTool(tool.toolDefinitionId, !tool.isEnabled)}
          control={
            <Switch
              disabled={!canManage || pending}
              checked={tool.isEnabled}
              aria-label={title}
              onCheckedChange={(checked) =>
                toggleTool(tool.toolDefinitionId, checked)
              }
            />
          }
        />
      ))}
    </CatalogTogglePanel>
  );
}
