"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

function humanToolName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function EmployeeToolsTab({
  employeeId,
  tools,
  canManage,
  isPlatformAdmin = false,
}: Props) {
  const t = useTranslations("agentBlueprint.employeeTools");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-5 text-white">
      {tools.map((tool) => {
        const riskKey =
          tool.riskLevel === "read" ||
          tool.riskLevel === "write" ||
          tool.riskLevel === "destructive"
            ? tool.riskLevel
            : "read";

        return (
          <div
            key={tool.toolDefinitionId}
            className="flex flex-col gap-3 rounded-lg border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{humanToolName(tool.name)}</p>
                {isPlatformAdmin ? (
                  <Badge
                    variant="outline"
                    className="border-white/10 font-mono text-[10px] text-white/45"
                  >
                    {tool.slug}
                  </Badge>
                ) : null}
                <Badge variant="secondary">{t(`risk.${riskKey}`)}</Badge>
                {tool.requiresApproval ? (
                  <Badge variant="destructive">{t("requiresApproval")}</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-white/50">{tool.description}</p>
            </div>
            <Switch
              disabled={!canManage || pending}
              checked={tool.isEnabled}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  await syncEmployeeToolAction({
                    employeeId,
                    toolDefinitionId: tool.toolDefinitionId,
                    isEnabled: checked,
                  });
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
