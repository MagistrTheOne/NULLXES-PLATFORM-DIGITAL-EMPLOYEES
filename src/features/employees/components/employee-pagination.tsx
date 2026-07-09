"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function buildPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    pages.push("…");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) {
    pages.push("…");
  }

  pages.push(total);
  return pages;
}

export function EmployeePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isLoading,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const window = buildPageWindow(page, Math.max(totalPages, 1));
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);
  const t = useTranslations("employees.list");

  return (
    <div className="flex flex-col items-center gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-between">
      <p className="text-xs tabular-nums text-white/45">
        {t("pageRange", {
          start: rangeStart,
          end: rangeEnd,
          total: totalItems,
        })}
      </p>

      <nav
        aria-label={t("pagesAria")}
        className="flex items-center gap-1"
      >
        <button
          type="button"
          aria-label={t("previousPage")}
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{t("previous")}</span>
        </button>

        {window.map((entry, index) =>
          entry === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-8 items-center justify-center text-xs text-white/30"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => onPageChange(entry)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border text-xs tabular-nums transition-colors disabled:opacity-50",
                entry === page
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/10 text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label={t("nextPage")}
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <ChevronRight className="size-4" />
        </button>
      </nav>

      <p className="text-xs tabular-nums text-white/45 sm:min-w-[5.5rem] sm:text-right">
        {t("pageOf", { page, total: Math.max(totalPages, 1) })}
      </p>
    </div>
  );
}
