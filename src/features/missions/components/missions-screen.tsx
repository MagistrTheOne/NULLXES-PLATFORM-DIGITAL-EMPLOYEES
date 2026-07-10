"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MissionListItem } from "../queries/list-organization-missions";

type MissionStatus = MissionListItem["status"];

const PAGE_SIZE = 6;

const STATUS_TAB_IDS = [
  "all",
  "planned",
  "working",
  "waiting_approval",
  "completed",
  "failed",
] as const;

type StatusTabId = (typeof STATUS_TAB_IDS)[number];

function statusLabelKey(status: MissionStatus): string {
  switch (status) {
    case "planned":
      return "statusPlanned";
    case "working":
      return "statusWorking";
    case "waiting_approval":
      return "statusReview";
    case "completed":
      return "statusCompleted";
    case "failed":
      return "statusFailed";
    case "cancelled":
      return "statusCancelled";
    default:
      return "statusPlanned";
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function matchesTab(status: MissionStatus, tab: StatusTabId): boolean {
  if (tab === "all") {
    return true;
  }
  if (tab === "failed") {
    return status === "failed" || status === "cancelled";
  }
  return status === tab;
}

function formatDate(value: Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function MissionRow({
  mission,
  t,
}: {
  mission: MissionListItem;
  t: ReturnType<typeof useTranslations<"missions.list">>;
}) {
  function copyLink() {
    if (typeof window !== "undefined") {
      void navigator.clipboard?.writeText(
        `${window.location.origin}/dashboard/missions/${mission.id}`,
      );
    }
  }

  const typeLabel =
    mission.type === "prospecting" ? t("typeProspecting") : t("typeCustom");

  return (
    <li className="border-b border-white/8 last:border-b-0">
      <div className="grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors hover:bg-white/3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1.6fr)_7.5rem_11rem_9rem_auto] lg:gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {mission.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/50">
            {mission.employeeName}
            {" · "}
            {typeLabel}
          </p>
          {mission.brief ? (
            <p className="mt-1 line-clamp-1 text-xs text-white/35">
              {mission.brief}
            </p>
          ) : null}
        </div>

        <div className="flex items-center lg:justify-start">
          <Badge
            variant="outline"
            className="border-white/10 bg-transparent font-normal text-white/75"
          >
            {t(statusLabelKey(mission.status))}
          </Badge>
        </div>

        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <Avatar size="sm">
            {mission.employeeAvatarUrl ? (
              <AvatarImage
                src={mission.employeeAvatarUrl}
                alt={mission.employeeName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-white/10 text-[10px] text-white/70">
              {initials(mission.employeeName)}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm text-white/80">{mission.employeeName}</p>
        </div>

        <p className="hidden text-xs tabular-nums text-white/45 lg:block">
          {formatDate(mission.createdAt)}
        </p>

        <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Link href={`/dashboard/missions/${mission.id}`}>
              {t("view")}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white/50 hover:bg-white/5 hover:text-white"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#111111]">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/missions/${mission.id}`}>
                  {t("open")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>{t("copyLink")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

function MissionPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  t: ReturnType<typeof useTranslations<"missions.list">>;
}) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const window = buildPageWindow(page, Math.max(totalPages, 1));
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center gap-3 border-t border-white/8 px-4 py-4 sm:flex-row sm:justify-between">
      <p className="text-xs tabular-nums text-white/45">
        {t("pageRange", {
          start: rangeStart,
          end: rangeEnd,
          total: totalItems,
        })}
      </p>

      <nav aria-label={t("pagesAria")} className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t("previousPage")}
          disabled={page <= 1}
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
              onClick={() => onPageChange(entry)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border text-xs tabular-nums transition-colors",
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
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <ChevronRight className="size-4" />
        </button>
      </nav>

      <p className="text-xs tabular-nums text-white/45 sm:min-w-22 sm:text-right">
        {t("pageOf", { page, total: Math.max(totalPages, 1) })}
      </p>
    </div>
  );
}

export function MissionsScreen({
  missions,
  canCreate,
}: {
  missions: MissionListItem[];
  canCreate: boolean;
}) {
  const t = useTranslations("missions.list");
  const [activeTab, setActiveTab] = useState<StatusTabId>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);

  const tabCounts = useMemo(() => {
    const counts: Record<StatusTabId, number> = {
      all: missions.length,
      planned: 0,
      working: 0,
      waiting_approval: 0,
      completed: 0,
      failed: 0,
    };
    for (const mission of missions) {
      for (const tabId of STATUS_TAB_IDS) {
        if (tabId !== "all" && matchesTab(mission.status, tabId)) {
          counts[tabId] += 1;
        }
      }
    }
    return counts;
  }, [missions]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return missions.filter((mission) => {
      if (!matchesTab(mission.status, activeTab)) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        mission.title.toLowerCase().includes(normalized) ||
        mission.brief.toLowerCase().includes(normalized) ||
        mission.employeeName.toLowerCase().includes(normalized)
      );
    });
  }, [missions, activeTab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handlePageChange(nextPage: number): void {
    setPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tabLabel = (id: StatusTabId): string => {
    switch (id) {
      case "all":
        return t("tabAll");
      case "planned":
        return t("tabPlanned");
      case "working":
        return t("tabWorking");
      case "waiting_approval":
        return t("tabReview");
      case "completed":
        return t("tabCompleted");
      case "failed":
        return t("tabFailed");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">{t("subtitle")}</p>
        </div>
        {canCreate ? (
          <Button
            asChild
            className="shrink-0 bg-white text-black hover:bg-white/90"
          >
            <Link href="/dashboard/missions/new">{t("assign")}</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-b border-white/8 pb-px lg:flex-row lg:items-end lg:justify-between">
        <nav
          aria-label={t("tabsAria")}
          className="flex flex-wrap gap-1 overflow-x-auto"
        >
          {STATUS_TAB_IDS.map((tabId) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-white/55 hover:text-white",
                )}
              >
                <span>{tabLabel(tabId)}</span>
                <span className="text-xs tabular-nums text-white/40">
                  {tabCounts[tabId]}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="relative mb-2 lg:mb-1.5 lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="border-white/10 bg-[#111111] pl-9 text-white placeholder:text-white/35"
          />
        </div>
      </div>

      <div ref={listTopRef} className="scroll-mt-4" />

      {missions.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#111111] px-6 py-12 text-center">
          <p className="text-sm text-white/70">{t("empty")}</p>
          <p className="mt-2 text-sm text-white/50">{t("emptyHint")}</p>
          {canCreate ? (
            <Button
              asChild
              className="mt-6 bg-white text-black hover:bg-white/90"
            >
              <Link href="/dashboard/missions/new">{t("assignFirst")}</Link>
            </Button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#111111] px-6 py-12 text-center">
          <p className="text-sm text-white/60">{t("noMatches")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#111111]">
          <div className="hidden border-b border-white/8 px-4 py-2.5 text-[11px] uppercase tracking-wide text-white/35 lg:grid lg:grid-cols-[minmax(0,1.6fr)_7.5rem_11rem_9rem_auto] lg:gap-4">
            <span>{t("colMission")}</span>
            <span>{t("colStatus")}</span>
            <span>{t("colEmployee")}</span>
            <span>{t("colCreated")}</span>
            <span className="sr-only">{t("colActions")}</span>
          </div>

          <ul>
            {paged.map((mission) => (
              <MissionRow key={mission.id} mission={mission} t={t} />
            ))}
          </ul>

          <MissionPagination
            page={safePage}
            totalPages={pageCount}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
