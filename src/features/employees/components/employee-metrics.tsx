import { useTranslations } from "next-intl";
import {
  PlatformMetricCell,
  PlatformMetricGrid,
} from "@/components/layout/platform-metric-grid";
import type { EmployeeListItem } from "../types";

export function EmployeeMetrics({ employees }: { employees: EmployeeListItem[] }) {
  const t = useTranslations("employees.metrics");
  const active = employees.filter((employee) => employee.status === "active").length;
  const draft = employees.filter((employee) => employee.status === "draft").length;
  const paused = employees.filter((employee) => employee.status === "paused").length;

  return (
    <PlatformMetricGrid>
      <PlatformMetricCell label={t("employees")} value={employees.length} />
      <PlatformMetricCell label={t("active")} value={active} />
      <PlatformMetricCell label={t("draft")} value={draft} />
      <PlatformMetricCell label={t("paused")} value={paused} />
    </PlatformMetricGrid>
  );
}
