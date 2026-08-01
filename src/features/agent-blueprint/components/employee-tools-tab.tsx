"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { syncEmployeeToolAction } from "../actions/manage-blueprint";

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
        const title = t.has(titleKey) ? t(titleKey) : tool.name.replace(/_/g, " ");
        const blurb = t.has(blurbKey)
          ? t(blurbKey)
          : tool.description.trim();
        return { tool, title, blurb };
      })
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
  }, [optimisticTools, t]);

  const enabledCount = rows.filter((item) => item.tool.isEnabled).length;

  return (
    <div className="space-y-3 text-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-end justify-between gap-3 bg-[#0a0a0a]/95 pb-1 backdrop-blur-sm">
        <div>
          <h3 className="text-sm font-medium text-white/85">{t("title")}</h3>
          <p className="mt-1 text-sm text-white/45">{t("hint")}</p>
        </div>
        <p className="tabular-nums text-sm text-white/50">
          {t("enabledCount", { count: enabledCount })}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-4 py-6 text-center text-sm text-white/50">
          {t("empty")}
        </p>
      ) : (
        <div className="max-h-[min(28rem,55vh)] overflow-y-auto rounded-xl border border-white/10 bg-[#111111]">
          {rows.map(({ tool, title, blurb }, index) => (
            <div
              key={tool.toolDefinitionId}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-opacity",
                index > 0 && "border-t border-white/8",
                !tool.isEnabled && "opacity-55",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="font-medium leading-snug">{title}</p>
                  {isPlatformAdmin ? (
                    <p className="font-mono text-[10px] text-white/30">
                      {tool.slug}
                    </p>
                  ) : null}
                  {tool.requiresApproval ? (
                    <p className="text-xs text-white/40">
                      {t("requiresApproval")}
                    </p>
                  ) : null}
                </div>
                {blurb ? (
                  <p className="mt-0.5 line-clamp-1 text-sm text-white/45">
                    {blurb}
                  </p>
                ) : null}
              </div>
              <Switch
                disabled={!canManage || pending}
                checked={tool.isEnabled}
                aria-label={title}
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    setOptimistic({
                      toolDefinitionId: tool.toolDefinitionId,
                      isEnabled: checked,
                    });
                    await syncEmployeeToolAction({
                      employeeId,
                      toolDefinitionId: tool.toolDefinitionId,
                      isEnabled: checked,
                    });
                  })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
