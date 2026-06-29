import type { ReactNode } from "react";
import { platformMetricGridClass } from "@/shared/layout/platform-layout";
import { cn } from "@/lib/utils";

export function PlatformMetricCell({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <span className="text-[11px] text-white/50 sm:text-xs">{label}</span>
      <span className="text-xl font-medium tabular-nums text-white sm:text-2xl">
        {value}
      </span>
    </div>
  );
}

export function PlatformMetricGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(platformMetricGridClass, className)}>{children}</div>
  );
}
