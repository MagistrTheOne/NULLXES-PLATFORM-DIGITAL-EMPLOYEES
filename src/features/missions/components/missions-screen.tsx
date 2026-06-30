"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MissionListItem } from "../queries/list-organization-missions";

type MissionStatus = MissionListItem["status"];

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "planned", label: "Planned" },
  { id: "working", label: "In progress" },
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
      return "In progress";
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
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export function MissionsScreen({
  missions,
  canCreate,
}: {
  missions: MissionListItem[];
  canCreate: boolean;
}) {
  const [activeTab, setActiveTab] = useState<StatusTabId>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const planned = missions.filter((m) => m.status === "planned").length;
    const working = missions.filter((m) => m.status === "working").length;
    const review = missions.filter(
      (m) => m.status === "waiting_approval",
    ).length;
    const completed = missions.filter((m) => m.status === "completed").length;
    const failed = missions.filter(
      (m) => m.status === "failed" || m.status === "cancelled",
    ).length;
    const resolved = completed + failed;
    const successRate =
      resolved > 0 ? Math.round((completed / resolved) * 100) : null;
    const activeEmployees = new Set(missions.map((m) => m.employeeId)).size;

    return {
      total: missions.length,
      planned,
      working,
      review,
      completed,
      failed,
      successRate,
      activeEmployees,
    };
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
          <Button asChild className="shrink-0 bg-white text-black hover:bg-white/90">
            <Link href="/dashboard/missions/new">Assign mission</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Total missions"
          value={String(stats.total)}
          hint={`${stats.planned} planned · ${stats.working} in progress · ${stats.failed} failed`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Success rate"
          value={stats.successRate === null ? "—" : `${stats.successRate}%`}
          hint={`${stats.completed} completed`}
        />
        <StatCard
          icon={Clock3}
          label="Awaiting review"
          value={String(stats.review)}
          hint="Pending approval"
        />
        <StatCard
          icon={Users}
          label="Digital employees"
          value={String(stats.activeEmployees)}
          hint="Active across missions"
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
        <div className="grid gap-3">
          {filtered.map((mission) => {
            const showProgress = mission.type === "prospecting";
            const progress = Math.min(mission.leadsCount, 10);
            return (
              <Link
                key={mission.id}
                href={`/dashboard/missions/${mission.id}`}
                className="group rounded-2xl border border-white/8 bg-[#111111] px-5 py-4 transition-colors hover:border-white/15 hover:bg-white/3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-white">
                      {mission.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-white/60">
                      {mission.employeeName}
                      {" · "}
                      {mission.type === "prospecting"
                        ? "Prospecting"
                        : "Custom"}
                      {" · "}
                      {formatDate(mission.createdAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-white/45">
                      {mission.brief}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      {mission.source === "scheduled" ? (
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-transparent text-white/60"
                        >
                          Scheduled
                        </Badge>
                      ) : null}
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-transparent text-white/80"
                      >
                        {statusLabel(mission.status)}
                      </Badge>
                    </div>
                    <span className="text-xs text-white/45">
                      {mission.leadsCount} proposals
                    </span>
                  </div>
                </div>
                {showProgress ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-white/50"
                        style={{ width: `${(progress / 10) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-white/40">
                      {progress}/10
                    </span>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
