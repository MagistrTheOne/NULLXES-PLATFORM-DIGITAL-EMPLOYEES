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

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-[#111111] px-5 py-8 text-center text-sm text-white/50">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ tool, title, blurb }) => (
            <article
              key={tool.toolDefinitionId}
              className={cn(
                "flex min-h-37 flex-col rounded-xl border border-white/10 bg-[#111111] p-4 transition-opacity",
                !tool.isEnabled && "opacity-55",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{title}</p>
                  {isPlatformAdmin ? (
                    <p className="mt-1 font-mono text-[10px] text-white/35">
                      {tool.slug}
                    </p>
                  ) : null}
                  {tool.requiresApproval ? (
                    <p className="mt-2 text-xs text-white/45">
                      {t("requiresApproval")}
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
              {blurb ? (
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {blurb}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
