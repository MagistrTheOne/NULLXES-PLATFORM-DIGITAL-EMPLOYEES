import Link from "next/link";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

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

export default function DocsLimitsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Лимиты платформы
        </h2>
        <p className="mt-4">
          Enforcement-числа из{" "}
          <span className="font-mono text-white">BILLING_PLANS</span>. Полная
          матрица:{" "}
          <Link href="/docs/plans" className="text-white underline">
            /docs/plans
          </Link>
          .
        </p>
      </header>

      <section
        id="workforce"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Workforce</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-120 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">План</th>
                <th className="py-2 pr-3 font-medium">Employees</th>
                <th className="py-2 pr-3 font-medium">Seats</th>
                <th className="py-2 font-medium">Create</th>
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
                      {l.canCreateEmployees ? "да" : "нет"}
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
        <h3 className="font-medium text-white">Talk</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-100 text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">План</th>
                <th className="py-2 pr-3 font-medium">Сессия</th>
                <th className="py-2 font-medium">Месяц</th>
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
                        : `${Math.round(l.maxSessionSeconds / 60)} мин`}
                    </td>
                    <td className="py-2">
                      {l.maxTalkMinutesPerMonth === null
                        ? "∞"
                        : `${l.maxTalkMinutesPerMonth.toLocaleString("ru-RU")} мин`}
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
        <h3 className="font-medium text-white">Knowledge</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>maxKnowledgeChunks — индекс по организации (см. матрицу тарифов)</li>
          <li>Starter: 2 500 · Studio: 15 000 · Team: 50 000 · Scale: 150 000</li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">API</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>none — Evaluation / Starter / Studio</li>
          <li>read — Team</li>
          <li>full — Scale / Enterprise / Holding</li>
        </ul>
      </section>
    </article>
  );
}
