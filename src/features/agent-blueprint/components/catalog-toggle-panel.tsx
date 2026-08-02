"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CatalogFilterId = "all" | "on" | "off";

export function CatalogTogglePanel({
  filters,
  filter,
  onFilterChange,
  countLabel,
  empty,
  children,
  className,
}: {
  filters: { id: CatalogFilterId; label: string }[];
  filter: CatalogFilterId;
  onFilterChange: (id: CatalogFilterId) => void;
  countLabel: ReactNode;
  empty: ReactNode | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-white", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
        <div className="inline-flex rounded-md border border-white/10 bg-black/50 p-0.5">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                filter === id
                  ? "bg-white text-black"
                  : "text-white/45 hover:text-white/80",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="tabular-nums text-xs text-white/40">{countLabel}</div>
      </div>
      {empty ? (
        <div className="px-4 py-10 text-center text-sm text-white/45">{empty}</div>
      ) : (
        <div className="max-h-[min(28rem,55vh)] overflow-y-auto">{children}</div>
      )}
    </div>
  );
}

export function CatalogToggleRow({
  title,
  blurb,
  enabled,
  disabled,
  badge,
  tooltip,
  control,
  onToggle,
}: {
  title: string;
  blurb?: string;
  enabled: boolean;
  disabled?: boolean;
  badge?: ReactNode;
  tooltip?: string;
  control: ReactNode;
  onToggle?: () => void;
}) {
  const interactive = Boolean(onToggle) && !disabled;

  return (
    <div
      title={tooltip}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onToggle : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
      className={cn(
        "group flex items-center gap-3 border-l-2 border-t border-t-white/[0.06] px-3 py-2 first:border-t-0",
        enabled
          ? "border-l-white bg-white/[0.04]"
          : "border-l-transparent opacity-45 hover:opacity-75",
        interactive && "cursor-pointer hover:bg-white/[0.03]",
        disabled && "cursor-default",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium leading-none tracking-tight">
            {title}
          </p>
          {badge}
        </div>
        {blurb ? (
          <p className="mt-1 truncate text-[11px] leading-none text-white/35">
            {blurb}
          </p>
        ) : null}
      </div>
      <div
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {control}
      </div>
    </div>
  );
}
