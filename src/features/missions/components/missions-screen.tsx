import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MissionListItem } from "../queries/list-organization-missions";

function statusLabel(status: MissionListItem["status"]): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "working":
      return "Working";
    case "waiting_approval":
      return "Waiting approval";
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

export function MissionsScreen({
  missions,
  canCreate,
}: {
  missions: MissionListItem[];
  canCreate: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
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
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href="/dashboard/missions/new">Assign mission</Link>
          </Button>
        ) : null}
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
      ) : (
        <div className="grid gap-4">
          {missions.map((mission) => (
            <Link
              key={mission.id}
              href={`/dashboard/missions/${mission.id}`}
              className="rounded-2xl border border-white/8 bg-[#111111] px-5 py-4 transition-colors hover:bg-white/3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-white">
                    {mission.title}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {mission.employeeName}
                    {" · "}
                    {mission.type === "prospecting" ? "Prospecting" : "Custom"}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-white/50">
                    {mission.brief}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    {mission.source === "scheduled" ? (
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-transparent text-white/70"
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
