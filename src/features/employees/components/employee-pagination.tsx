"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
  onPageChange,
  isLoading,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const window = buildPageWindow(page, totalPages);

  return (
    <nav
      aria-label="Employee pages"
      className="flex items-center justify-center gap-1 pt-1"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
        className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="size-4" />
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
        aria-label="Next page"
        disabled={page >= totalPages || isLoading}
        onClick={() => onPageChange(page + 1)}
        className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
