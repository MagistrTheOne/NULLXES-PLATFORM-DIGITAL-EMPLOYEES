import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

export async function generateMetadata() {
  return docsPageMetadata("/docs/plans");
}

const DISPLAY_NAME: Record<BillingPlanId, string> = {
  free: "Evaluation",
  starter: "Starter",
  studio: "Studio",
  operator: "Team",
  scale: "Scale",
  enterprise: "Enterprise",
  government: "Holding",
};

const PLAN_ORDER: BillingPlanId[] = [
  "free",
  "starter",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
];

const PLAN_NAME_IDS = [
  "free",
  "starter",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
] as const;

export default async function DocsPlansPage() {
  const t = await getTranslations("docs.plans");
  const locale = await getLocale();
  const apiAccessItems = t.raw("apiAccessItems") as string[];

  const formatLimit = (value: number | null, unit?: string): string => {
    if (value === null) {
      return t("unlimited");
    }
    return unit
      ? `${value.toLocaleString(locale)} ${unit}`
      : String(value);
  };

  const formatApi = (level: "none" | "read" | "full"): string => {
    if (level === "none") return t("apiNone");
    if (level === "read") return t("apiRead");
    return t("apiFull");
  };

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">
          {t("introPrefix")}{" "}
          <span className="font-mono text-white">
            src/features/billing/config/plans.ts
          </span>
          . {t("introSuffix")}
        </p>
      </header>

      <section
        id="names"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("namesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {PLAN_NAME_IDS.map((id) => (
            <li key={id}>
              <span className="font-mono text-white">{id}</span> →{" "}
              <strong className="text-white">{DISPLAY_NAME[id]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="matrix"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("matrixTitle")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-160 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">{t("planHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("priceHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("employeesHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("talkSessionHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("talkMonthHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("chunksHeader")}</th>
                <th className="py-2 font-medium">{t("apiHeader")}</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {PLAN_ORDER.map((id) => {
                const plan = BILLING_PLANS[id];
                return (
                  <tr key={id} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">{DISPLAY_NAME[id]}</td>
                    <td className="py-2 pr-3 font-mono">{plan.priceLabel}</td>
                    <td className="py-2 pr-3">
                      {formatLimit(plan.limits.maxEmployees)}
                      {!plan.limits.canCreateEmployees ? " *" : ""}
                    </td>
                    <td className="py-2 pr-3">
                      {plan.limits.maxSessionSeconds === null
                        ? t("unlimited")
                        : `${Math.round(plan.limits.maxSessionSeconds / 60)} ${t("minutesUnit")}`}
                    </td>
                    <td className="py-2 pr-3">
                      {formatLimit(
                        plan.limits.maxTalkMinutesPerMonth,
                        t("minutesUnit"),
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {formatLimit(plan.limits.maxKnowledgeChunks)}
                    </td>
                    <td className="py-2">
                      {formatApi(plan.limits.apiAccess)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-white/40">{t("evaluationNote")}</p>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("apiAccessTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {apiAccessItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          {t("apiMorePrefix")}{" "}
          <Link href="/docs/api" className="text-white underline">
            /docs/api
          </Link>
          . {t("limitsMorePrefix")}{" "}
          <Link href="/docs/limits" className="text-white underline">
            /docs/limits
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
