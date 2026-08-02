"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { InferSelectModel } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { Switch } from "@/components/ui/switch";
import {
  assignEmployeeSkillsAction,
  removeEmployeeSkillAction,
} from "../actions/manage-blueprint";
import {
  CatalogTogglePanel,
  CatalogToggleRow,
  type CatalogFilterId,
} from "./catalog-toggle-panel";

type Assignment = {
  skillId: string;
  skillName: string;
  skillSlug: string;
  proficiency: "basic" | "standard" | "expert";
  priority: number;
  isActive: boolean;
};

type SkillRow = InferSelectModel<typeof skill>;

type Props = {
  employeeId: string;
  library: SkillRow[];
  assignments: Assignment[];
  canManage: boolean;
  isPlatformAdmin?: boolean;
};

type OptimisticToggle = { skillId: string; enabled: boolean };

export function EmployeeSkillsTab({
  employeeId,
  library,
  assignments,
  canManage,
  isPlatformAdmin = false,
}: Props) {
  const t = useTranslations("agentBlueprint.employeeSkills");
  const tTools = useTranslations("agentBlueprint.employeeTools");
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<CatalogFilterId>("all");
  const [optimisticAssignments, setOptimisticAssignments] = useOptimistic(
    assignments,
    (state, update: OptimisticToggle) => {
      if (update.enabled) {
        const existing = state.find((row) => row.skillId === update.skillId);
        if (existing) {
          return state.map((row) =>
            row.skillId === update.skillId ? { ...row, isActive: true } : row,
          );
        }
        const skillRow = library.find((row) => row.id === update.skillId);
        if (!skillRow) return state;
        return [
          ...state,
          {
            skillId: skillRow.id,
            skillName: skillRow.name,
            skillSlug: skillRow.slug,
            proficiency: "standard" as const,
            priority: state.length,
            isActive: true,
          },
        ];
      }
      return state.filter((row) => row.skillId !== update.skillId);
    },
  );

  const assignmentBySkillId = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const row of optimisticAssignments) {
      map.set(row.skillId, row);
    }
    return map;
  }, [optimisticAssignments]);

  const rows = useMemo(() => {
    return [...library]
      .map((row) => {
        const titleKey = `catalog.${row.slug}.title` as const;
        const blurbKey = `catalog.${row.slug}.blurb` as const;
        const title = t.has(titleKey) ? t(titleKey) : row.name;
        const blurb = t.has(blurbKey)
          ? t(blurbKey)
          : (row.description?.trim() ?? "");
        const assignment = assignmentBySkillId.get(row.id);
        const enabled = Boolean(assignment?.isActive);
        const toolLabels = (row.requiredToolSlugs ?? [])
          .map((slug) => {
            const key = `catalog.${slug}.title` as const;
            return tTools.has(key) ? tTools(key) : null;
          })
          .filter((label): label is string => Boolean(label));
        return { row, title, blurb, enabled, toolLabels };
      })
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      });
  }, [library, assignmentBySkillId, t, tTools]);

  const visible = rows.filter((item) => {
    if (filter === "on") return item.enabled;
    if (filter === "off") return !item.enabled;
    return true;
  });

  const enabledCount = rows.filter((item) => item.enabled).length;
  const totalCount = rows.length;

  function toggleSkill(skillId: string, enabled: boolean) {
    if (!canManage || pending) return;
    startTransition(async () => {
      setOptimisticAssignments({ skillId, enabled });
      if (enabled) {
        await assignEmployeeSkillsAction({
          employeeId,
          skillIds: [skillId],
        });
        return;
      }
      await removeEmployeeSkillAction({
        employeeId,
        skillId,
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
            ? t("emptyLibrary")
            : t("emptyFilter")
          : null
      }
    >
      {visible.map(({ row, title, blurb, enabled, toolLabels }) => (
        <CatalogToggleRow
          key={row.id}
          title={title}
          blurb={blurb}
          enabled={enabled}
          disabled={!canManage || pending}
          tooltip={
            isPlatformAdmin
              ? `${row.slug}${toolLabels.length ? ` · ${toolLabels.join(", ")}` : ""}`
              : toolLabels.length
                ? t("usesTools", { tools: toolLabels.join(" · ") })
                : blurb || undefined
          }
          onToggle={() => toggleSkill(row.id, !enabled)}
          control={
            <Switch
              disabled={!canManage || pending}
              checked={enabled}
              aria-label={title}
              onCheckedChange={(checked) => toggleSkill(row.id, checked)}
            />
          }
        />
      ))}
    </CatalogTogglePanel>
  );
}
