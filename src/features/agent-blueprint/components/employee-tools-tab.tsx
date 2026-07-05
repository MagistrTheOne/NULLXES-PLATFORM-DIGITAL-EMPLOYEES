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
};

export function EmployeeToolsTab({ employeeId, tools, canManage }: Props) {
  const t = useTranslations("agentBlueprint.employeeTools");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-5 text-white">
      {tools.map((tool) => (
        <div
          key={tool.toolDefinitionId}
          className="flex flex-col gap-3 rounded-lg border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{tool.name}</p>
              <Badge variant="outline">{tool.slug}</Badge>
              <Badge variant="secondary">{tool.riskLevel}</Badge>
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
      ))}
    </div>
  );
}
