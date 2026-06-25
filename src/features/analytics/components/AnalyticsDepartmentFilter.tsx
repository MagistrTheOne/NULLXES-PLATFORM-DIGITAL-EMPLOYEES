"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HQ_DEPARTMENTS, type HqDepartment } from "@/features/hq/types";

function buildHref(
  searchParams: URLSearchParams,
  department: HqDepartment | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (department) {
    params.set("department", department);
  } else {
    params.delete("department");
  }
  const query = params.toString();
  return query ? `/dashboard/analytics?${query}` : "/dashboard/analytics";
}

export function AnalyticsDepartmentFilter({
  active,
}: {
  active: HqDepartment | null;
}) {
  const t = useTranslations("analytics");
  const tDepartments = useTranslations("hq.departments");
  const searchParams = useSearchParams();

  const chip = (department: HqDepartment | null, label: string) => {
    const isActive = active === department;
    return (
      <Link
        key={department ?? "all"}
        href={buildHref(searchParams, department)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
          isActive
            ? "border-white/25 bg-white/10 text-white"
            : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white/80",
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chip(null, t("departmentScope.all"))}
      {HQ_DEPARTMENTS.map((department) =>
        chip(department, tDepartments(department)),
      )}
      <Link
        href={
          active ? `/dashboard/hq?department=${active}` : "/dashboard/hq"
        }
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/20 hover:text-white"
      >
        <Building2 className="size-3.5" />
        {t("openHq")}
      </Link>
    </div>
  );
}
