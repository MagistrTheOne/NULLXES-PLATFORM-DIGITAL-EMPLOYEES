import { useTranslations } from "next-intl";
import type { EmployeeListItem } from "../types";

type EmployeeMetricsProps = {
  employees: EmployeeListItem[];
};

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-white/10 bg-[#111111] px-4 py-3">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-2xl font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

export function EmployeeMetrics({ employees }: EmployeeMetricsProps) {
  const t = useTranslations("employees.metrics");
  const active = employees.filter((employee) => employee.status === "active").length;
  const draft = employees.filter((employee) => employee.status === "draft").length;
  const paused = employees.filter((employee) => employee.status === "paused").length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
      <MetricCell label={t("employees")} value={employees.length} />
      <MetricCell label={t("active")} value={active} />
      <MetricCell label={t("draft")} value={draft} />
      <MetricCell label={t("paused")} value={paused} />
    </div>
  );
}
