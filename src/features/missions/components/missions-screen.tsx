"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Radar,
  Search,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { MissionListItem } from "../queries/list-organization-missions";

type MissionStatus = MissionListItem["status"];

const PAGE_SIZE = 6;

const STATUS_TABS = [
  { id: "all", label: "All Missions" },
  { id: "planned", label: "Planned" },
  { id: "working", label: "In Progress" },
  { id: "waiting_approval", label: "Review" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
] as const;

type StatusTabId = (typeof STATUS_TABS)[number]["id"];

function statusLabel(status: MissionStatus): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "working":
      return "In Progress";
    case "waiting_approval":
      return "Review";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function stageProgress(status: MissionStatus): number {
  switch (status) {
    case "planned":
      return 0;
    case "working":
      return 30;
    case "waiting_approval":
      return 70;
    case "completed":
      return 100;
    default:
      return 0;
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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#111111] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/40">
          {label}
        </span>
        <Icon className="size-4 text-white/30" />
      </div>
      <p className="mt-3 text-2xl font-medium tracking-tight text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

function MissionCard({ mission }: { mission: MissionListItem }) {
  const progress =
    mission.type === "prospecting" && mission.leadsCount > 0
      ? Math.min(Math.round((Math.min(mission.leadsCount, 10) / 10) * 100), 100)
      : stageProgress(mission.status);

  function copyLink() {
    if (typeof window !== "undefined") {
      void navigator.clipboard?.writeText(
        `${window.location.origin}/dashboard/missions/${mission.id}`,
      );
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111111] p-5 transition-colors hover:border-white/15">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
            <Radar className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-white">
              {mission.title}
            </p>
            <p className="mt-0.5 truncate text-sm text-white/60">
              {mission.employeeName}
              {" · "}
              {mission.type === "prospecting" ? "Prospecting" : "Custom"}
            </p>
            <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/45">
              {mission.brief}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-44">
          <p className="text-xs uppercase tracking-wide text-white/40">Status</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-transparent text-white/80"
            >
              {statusLabel(mission.status)}
            </Badge>
            <span className="text-xs text-white/45">{progress}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-white/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-white/40">
            Proposals
          </p>
          <p className="mt-1 text-sm text-white/70">{mission.leadsCount}</p>
        </div>

        <div className="w-full shrink-0 lg:w-48">
          <p className="text-xs uppercase tracking-wide text-white/40">
            Assigned to
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-white/10 text-white/70">
                {initials(mission.employeeName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">
                {mission.employeeName}
              </p>
              <p className="truncate text-xs text-white/45">Digital Employee</p>
            </div>
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-white/40">
            Created
          </p>
          <p className="mt-1 text-xs text-white/55">
            {formatDate(mission.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            <Link href={`/dashboard/missions/${mission.id}`}>
              View mission
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 bg-transparent text-white/70 hover:bg-white/5"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#111111]">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/missions/${mission.id}`}>
                  Open mission
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState<StatusTabId>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);

  const stats = useMemo(() => {
    const planned = missions.filter((m) => m.status === "planned").length;
    const working = missions.filter((m) => m.status === "working").length;
    const completed = missions.filter((m) => m.status === "completed").length;
    const failed = missions.filter(
      (m) => m.status === "failed" || m.status === "cancelled",
    ).length;
    return { total: missions.length, planned, working, completed, failed };
  }, [missions]);

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
      for (const tab of STATUS_TABS) {
        if (tab.id !== "all" && matchesTab(mission.status, tab.id)) {
          counts[tab.id] += 1;
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Mission Control
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Assign missions to digital employees, review evidence, and approve
            outputs before anything goes outbound.
          </p>
        </div>
        {canCreate ? (
          <Button
            asChild
            className="shrink-0 bg-white text-black hover:bg-white/90"
          >
            <Link href="/dashboard/missions/new">Assign mission</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={Briefcase}
          label="Total Missions"
          value={String(stats.total)}
          hint="All time"
        />
        <StatCard
          icon={Clock3}
          label="Planned"
          value={String(stats.planned)}
          hint="Awaiting execution"
        />
        <StatCard
          icon={Radar}
          label="In Progress"
          value={String(stats.working)}
          hint="Actively running"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={String(stats.completed)}
          hint="Successfully delivered"
        />
        <StatCard
          icon={Users}
          label="Failed"
          value={String(stats.failed)}
          hint="Needs attention"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-xs text-white/40">{tabCounts[tab.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search missions..."
            className="border-white/10 bg-[#111111] pl-9 text-white placeholder:text-white/35"
          />
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#111111] px-6 py-12 text-center">
          <p className="text-sm text-white/70">No missions yet.</p>
          <p className="mt-2 text-sm text-white/50">
            Start with a prospecting mission for your sales employee.
          </p>
          {canCreate ? (
            <Button
              asChild
              className="mt-6 bg-white text-black hover:bg-white/90"
            >
              <Link href="/dashboard/missions/new">Assign first mission</Link>
            </Button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#111111] px-6 py-12 text-center">
          <p className="text-sm text-white/60">
            No missions match this filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {paged.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-white/10 bg-transparent text-white/70 hover:bg-white/5"
              >
                <ArrowRight className="size-4 rotate-180" />
              </Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`size-9 rounded-lg text-sm transition-colors ${
                      pageNumber === safePage
                        ? "bg-white/10 text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <Button
                variant="outline"
                size="icon"
                disabled={safePage === pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="border-white/10 bg-transparent text-white/70 hover:bg-white/5"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
