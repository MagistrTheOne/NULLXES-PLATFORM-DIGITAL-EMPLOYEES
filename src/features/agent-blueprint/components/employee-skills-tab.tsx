"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { InferSelectModel } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  assignEmployeeSkillsAction,
  removeEmployeeSkillAction,
} from "../actions/manage-blueprint";

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

type FilterId = "all" | "on" | "off";

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
  const [filter, setFilter] = useState<FilterId>("all");
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
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
  }, [library, assignmentBySkillId, t, tTools]);

  const visible = rows.filter((item) => {
    if (filter === "on") return item.enabled;
    if (filter === "off") return !item.enabled;
    return true;
  });

  const enabledCount = rows.filter((item) => item.enabled).length;

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white/85">{t("title")}</h3>
          <p className="mt-1 max-w-2xl text-sm text-white/45">{t("hint")}</p>
        </div>
        <p className="tabular-nums text-sm text-white/50">
          {t("enabledCount", { count: enabledCount })}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {(
          [
            ["all", t("filterAll")],
            ["on", t("filterOn")],
            ["off", t("filterOff")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              filter === id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white/80",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-5 py-8 text-center text-sm text-white/50">
          {rows.length === 0 ? t("emptyLibrary") : t("emptyFilter")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ row, title, blurb, enabled, toolLabels }) => (
            <article
              key={row.id}
              className={cn(
                "flex min-h-37 flex-col rounded-xl border border-white/10 bg-[#111111] p-4 transition-opacity",
                !enabled && "opacity-55",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{title}</p>
                  {isPlatformAdmin ? (
                    <p className="mt-1 font-mono text-[10px] text-white/35">
                      {row.slug}
                    </p>
                  ) : null}
                </div>
                <Switch
                  disabled={!canManage || pending}
                  checked={enabled}
                  aria-label={title}
                  onCheckedChange={(checked) =>
                    startTransition(async () => {
                      setOptimisticAssignments({
                        skillId: row.id,
                        enabled: checked,
                      });
                      if (checked) {
                        await assignEmployeeSkillsAction({
                          employeeId,
                          skillIds: [row.id],
                        });
                        return;
                      }
                      await removeEmployeeSkillAction({
                        employeeId,
                        skillId: row.id,
                      });
                    })
                  }
                />
              </div>
              {blurb ? (
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {blurb}
                </p>
              ) : null}
              {toolLabels.length > 0 ? (
                <p className="mt-auto pt-3 text-xs text-white/35">
                  {t("usesTools", { tools: toolLabels.join(" · ") })}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
