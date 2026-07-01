"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { useWorkspaceBilling } from "@/features/workspace/components/workspace-billing-provider";
import { startScenarioSessionAction } from "../actions/scenario-session";
import {
  getScenarioMonthlyLimitForPlan,
} from "../lib/scenario-free-limits";
import {
  rankScenarioTemplatesForRole,
  SCENARIO_TEMPLATES,
  type ScenarioTemplate,
} from "../lib/scenario-templates";

function ScenarioTemplateCard({
  template,
  disabled,
  onSelect,
}: {
  template: ScenarioTemplate;
  disabled: boolean;
  onSelect: (templateId: string) => void;
}) {
  const t = useTranslations("employees.scenarios.templates");

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardContent className="flex flex-col gap-3 px-5 py-5">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t(template.titleKey)}</h3>
          <p className="text-xs leading-relaxed text-white/55">
            {t(template.descriptionKey)}
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-wide text-white/35">
          {t(`difficulty.${template.difficulty}`)}
        </p>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(template.id)}
          className="mt-auto bg-white text-black hover:bg-white/90 disabled:opacity-40"
        >
          {t("runScenario")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ScenarioPickerScreen({
  employeeId,
  employeeName,
  employeeRole,
  scenariosUsedThisMonth,
  billingPlan,
}: {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  scenariosUsedThisMonth: number;
  billingPlan: BillingPlanId;
}) {
  const router = useRouter();
  const t = useTranslations("employees.scenarios.picker");
  const { checkoutUrl } = useWorkspaceBilling();
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const monthlyLimit = getScenarioMonthlyLimitForPlan(billingPlan);
  const atLimit =
    monthlyLimit != null && scenariosUsedThisMonth >= monthlyLimit;

  const ranked = rankScenarioTemplatesForRole(employeeRole);
  const recommended = ranked.slice(0, 3);
  const recommendedIds = new Set(recommended.map((template) => template.id));
  const remaining = SCENARIO_TEMPLATES.filter(
    (template) => !recommendedIds.has(template.id),
  );

  async function handleSelect(templateId: string) {
    if (atLimit || pendingTemplateId) {
      return;
    }

    setPendingTemplateId(templateId);
    setError(null);

    const result = await startScenarioSessionAction({
      employeeId,
      templateId,
    });

    if (!result.ok) {
      setError(result.message);
      setPendingTemplateId(null);
      return;
    }

    router.push(
      `/dashboard/employees/${employeeId}/talk?scenario=${result.scenarioSessionId}`,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Link
          href={`/dashboard/employees/${employeeId}`}
          className="text-xs text-white/45 hover:text-white/70"
        >
          {t("backToEmployee")}
        </Link>
        <h1 className="text-2xl font-medium tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-white/60">
          {t("subtitle", { name: employeeName, role: employeeRole })}
        </p>
        {monthlyLimit != null ? (
          <p className="text-xs text-white/45">
            {t("monthlyUsage", {
              used: scenariosUsedThisMonth,
              limit: monthlyLimit,
            })}
          </p>
        ) : null}
      </div>

      {atLimit ? (
        <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-4 text-sm text-white/70">
          <p>{t("limitReached")}</p>
          <div className="mt-3">
            {checkoutUrl ? (
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <Link href={checkoutUrl}>{t("upgrade")}</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="border-white/12">
                <Link href="/settings?tab=billing">{t("billing")}</Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-white/55" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-white/80">{t("recommended")}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommended.map((template) => (
            <ScenarioTemplateCard
              key={template.id}
              template={template}
              disabled={Boolean(pendingTemplateId) || atLimit}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      {remaining.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-white/80">{t("allScenarios")}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {remaining.map((template) => (
              <ScenarioTemplateCard
                key={template.id}
                template={template}
                disabled={Boolean(pendingTemplateId) || atLimit}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </section>
      ) : null}

      {pendingTemplateId ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="size-4 animate-spin" />
          {t("starting")}
        </div>
      ) : null}
    </div>
  );
}
