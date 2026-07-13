import Link from "next/link";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

/** Product-facing names (id → label). Source of truth for limits: BILLING_PLANS. */
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

function formatLimit(value: number | null, unit?: string): string {
  if (value === null) {
    return "Без лимита";
  }
  return unit ? `${value.toLocaleString("ru-RU")} ${unit}` : String(value);
}

function formatApi(level: "none" | "read" | "full"): string {
  if (level === "none") return "Нет";
  if (level === "read") return "Read";
  return "Full";
}

export default function DocsPlansPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Тарифы и лимиты
        </h2>
        <p className="mt-4">
          Справочник из{" "}
          <span className="font-mono text-white">
            src/features/billing/config/plans.ts
          </span>
          . Self-serve: Evaluation → Starter → Studio → Team → Scale. Sales:
          Enterprise, Holding.
        </p>
      </header>

      <section
        id="names"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Имена планов</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {(
            [
              ["free", "Evaluation"],
              ["starter", "Starter"],
              ["studio", "Studio"],
              ["operator", "Team"],
              ["scale", "Scale"],
              ["enterprise", "Enterprise"],
              ["government", "Holding"],
            ] as const
          ).map(([id, label]) => (
            <li key={id}>
              <span className="font-mono text-white">{id}</span> →{" "}
              <strong className="text-white">{label}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="matrix"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Матрица тарифов</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-160 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">План</th>
                <th className="py-2 pr-3 font-medium">Цена</th>
                <th className="py-2 pr-3 font-medium">Employees</th>
                <th className="py-2 pr-3 font-medium">Talk / сессия</th>
                <th className="py-2 pr-3 font-medium">Talk / мес</th>
                <th className="py-2 pr-3 font-medium">Chunks</th>
                <th className="py-2 font-medium">API</th>
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
                        ? "Без лимита"
                        : `${Math.round(plan.limits.maxSessionSeconds / 60)} мин`}
                    </td>
                    <td className="py-2 pr-3">
                      {formatLimit(plan.limits.maxTalkMinutesPerMonth, "мин")}
                    </td>
                    <td className="py-2 pr-3">
                      {formatLimit(plan.limits.maxKnowledgeChunks)}
                    </td>
                    <td className="py-2">{formatApi(plan.limits.apiAccess)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-white/40">
          * Evaluation: создание своих сотрудников отключено — curated catalog
          NULLXES (Talk разрешён). Каталог не считается в maxEmployees.
        </p>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Доступ к Public API</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Evaluation / Starter / Studio — ключи не создаются</li>
          <li>Team — scopes чтения (employees:read, sessions:read)</li>
          <li>Scale / Enterprise / Holding — полный доступ</li>
        </ul>
        <p className="mt-4">
          Подробнее:{" "}
          <Link href="/docs/api" className="text-white underline">
            /docs/api
          </Link>
          . Лимиты enforcement:{" "}
          <Link href="/docs/limits" className="text-white underline">
            /docs/limits
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
