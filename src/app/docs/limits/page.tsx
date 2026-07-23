import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

export async function generateMetadata() {
  return docsPageMetadata("/docs/limits");
}

const PLAN_ORDER: BillingPlanId[] = [
  "free",
  "starter",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
];

const DISPLAY_NAME: Record<BillingPlanId, string> = {
  free: "Evaluation",
  starter: "Starter",
  studio: "Studio",
  operator: "Team",
  scale: "Scale",
  enterprise: "Enterprise",
  government: "Holding",
};

export default async function DocsLimitsPage() {
  const t = await getTranslations("docs.limits");
  const locale = await getLocale();
  const knowledgeItems = t.raw("knowledgeItems") as string[];
  const apiItems = t.raw("apiItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">
          {t("introPrefix")}{" "}
          <span className="font-mono text-white">BILLING_PLANS</span>.{" "}
          {t("introSuffix")}{" "}
          <Link href="/docs/plans" className="text-white underline">
            {t("plansLink")}
          </Link>
          .
        </p>
      </header>

      <section
        id="workforce"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("workforceTitle")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-120 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">{t("planHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("employeesHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("seatsHeader")}</th>
                <th className="py-2 font-medium">{t("createHeader")}</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {PLAN_ORDER.map((id) => {
                const l = BILLING_PLANS[id].limits;
                return (
                  <tr key={id} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">{DISPLAY_NAME[id]}</td>
                    <td className="py-2 pr-3">
                      {l.maxEmployees === null ? "∞" : l.maxEmployees}
                    </td>
                    <td className="py-2 pr-3">
                      {l.maxSeats === null ? "∞" : l.maxSeats}
                    </td>
                    <td className="py-2">
                      {l.canCreateEmployees ? t("yes") : t("no")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("talkTitle")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-100 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">{t("planHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("sessionHeader")}</th>
                <th className="py-2 font-medium">{t("monthHeader")}</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {PLAN_ORDER.map((id) => {
                const l = BILLING_PLANS[id].limits;
                return (
                  <tr key={id} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">{DISPLAY_NAME[id]}</td>
                    <td className="py-2 pr-3">
                      {l.maxSessionSeconds === null
                        ? "∞"
                        : `${Math.round(l.maxSessionSeconds / 60)} ${t("minutesUnit")}`}
                    </td>
                    <td className="py-2">
                      {l.maxTalkMinutesPerMonth === null
                        ? "∞"
                        : `${l.maxTalkMinutesPerMonth.toLocaleString(locale)} ${t("minutesUnit")}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="knowledge"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("knowledgeTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {knowledgeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("apiTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {apiItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
