"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ScenarioDebrief } from "@/entities/employee-scenario-session";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { useWorkspaceBilling } from "@/features/workspace/components/workspace-billing-provider";
import {
  markScenarioDebriefViewedAction,
  recordScenarioUpgradeClickAction,
} from "../actions/scenario-session";
import { getScenarioTemplateById } from "../lib/scenario-templates";

export function ScenarioDebriefScreen({
  employeeId,
  employeeName,
  scenarioSessionId,
  templateId,
  debrief,
  billingPlan,
}: {
  employeeId: string;
  employeeName: string;
  scenarioSessionId: string;
  templateId: string;
  debrief: ScenarioDebrief;
  billingPlan: BillingPlanId;
}) {
  const t = useTranslations("employees.scenarios.debrief");
  const tTemplates = useTranslations("employees.scenarios.templates");
  const { checkoutUrl } = useWorkspaceBilling();
  const template = getScenarioTemplateById(templateId);
  const isFree = billingPlan === "free";

  useEffect(() => {
    void markScenarioDebriefViewedAction(scenarioSessionId);
  }, [scenarioSessionId]);

  function handleUpgradeClick() {
    void recordScenarioUpgradeClickAction(scenarioSessionId);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Link
          href={`/dashboard/employees/${employeeId}`}
          className="text-xs text-white/45 hover:text-white/70"
        >
          {t("backToEmployee")}
        </Link>
        <p className="text-xs uppercase tracking-wide text-white/40">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-medium tracking-tight">{t("title")}</h1>
        <p className="text-sm text-white/60">
          {template
            ? tTemplates(template.titleKey)
            : templateId}{" "}
          · {employeeName}
        </p>
      </div>

      <Card className="border-white/10 bg-[#111111] py-0 text-white">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">
                {t("scoreLabel")}
              </p>
              <p className="text-4xl font-medium tabular-nums">{debrief.score}</p>
            </div>
            <p className="max-w-xs text-right text-xs text-white/45">
              {t("scoreHint")}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">{t("summary")}</h2>
            <p className="text-sm leading-relaxed text-white/65">
              {debrief.summary}
            </p>
          </div>

          {debrief.objectives.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium">{t("objectives")}</h2>
              <ul className="space-y-2">
                {debrief.objectives.map((objective) => (
                  <li
                    key={objective.id}
                    className="rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{objective.label}</span>
                      <span className="text-xs text-white/45">
                        {objective.met ? t("objectiveMet") : t("objectiveMissed")}
                      </span>
                    </div>
                    {objective.note ? (
                      <p className="mt-1 text-xs text-white/45">{objective.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h2 className="text-sm font-medium">{t("strengths")}</h2>
              <ul className="space-y-1 text-sm text-white/60">
                {debrief.strengths.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-medium">{t("improvements")}</h2>
              <ul className="space-y-1 text-sm text-white/60">
                {debrief.improvements.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFree ? (
        <Card className="border-white/10 bg-white/2 py-0 text-white">
          <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">{t("proUpsellTitle")}</h2>
              <p className="text-sm text-white/55">{t("proUpsellBody")}</p>
            </div>
            {checkoutUrl ? (
              <Button
                asChild
                className="shrink-0 bg-white text-black hover:bg-white/90"
                onClick={handleUpgradeClick}
              >
                <Link href={checkoutUrl}>{t("upgrade")}</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="shrink-0 border-white/12"
                onClick={handleUpgradeClick}
              >
                <Link href="/settings?tab=billing">{t("billing")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link href={`/dashboard/employees/${employeeId}/scenarios`}>
            {t("runAnother")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-white/12">
          <Link href={`/dashboard/employees/${employeeId}/talk`}>
            {t("openTalk")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
