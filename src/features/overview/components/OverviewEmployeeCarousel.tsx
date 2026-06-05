import Link from "next/link";
import { Loader2, Plus, UserRound } from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { formatRelativeTime } from "../lib/format-relative-time";
import type { OverviewEmployee } from "../types";
import { OverviewCard } from "./overview-card";

function CarouselEmployeeCard({ employee }: { employee: OverviewEmployee }) {
  const showPreview =
    employee.avatarPreviewUrl &&
    employee.avatarProvisioningStatus === "ready";
  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const talkedLabel = employee.lastSessionAt
    ? `Talked ${formatRelativeTime(employee.lastSessionAt)}`
    : "No sessions yet";

  return (
    <Link
      href={`/dashboard/employees/${employee.id}`}
      className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-white/[0.03]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center border-b border-border bg-white/[0.02]">
        {showPreview ? (
          <AvatarIdlePreview
            src={employee.avatarPreviewUrl!}
            alt={employee.name}
            sizes="220px"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isProvisioning ? (
              <Loader2 className="size-7 animate-spin stroke-[1.25]" />
            ) : (
              <UserRound className="size-7 stroke-[1.25]" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-foreground/80">
            {employee.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{employee.role}</p>
        </div>
        <EmployeeStatusBadge status={employee.status} />
        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
          <p>{talkedLabel}</p>
          <p className="tabular-nums text-foreground/80">
            {employee.sessionsInRange} sessions in period
          </p>
        </div>
      </div>
    </Link>
  );
}

function CreateEmployeeCard({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreateClick}
      className="flex w-[220px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-white/[0.03] hover:text-foreground"
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
        <Plus className="size-5" />
      </span>
      <span className="text-sm font-medium">Create Employee</span>
    </button>
  );
}

export function OverviewEmployeeCarousel({
  employees,
  onCreateClick,
}: {
  employees: OverviewEmployee[];
  onCreateClick: () => void;
}) {
  const activeFirst = [...employees].sort((left, right) => {
    if (left.status === "active" && right.status !== "active") {
      return -1;
    }
    if (right.status === "active" && left.status !== "active") {
      return 1;
    }
    return right.sessionsInRange - left.sessionsInRange;
  });

  return (
    <OverviewCard
      title="Your Digital Employees"
      description="Active workforce in this workspace"
    >
      <div className="flex gap-4 overflow-x-auto px-5 py-5">
        {activeFirst.length === 0 ? (
          <div className="flex min-h-[220px] w-full items-center justify-center">
            <CreateEmployeeCard onCreateClick={onCreateClick} />
          </div>
        ) : (
          <>
            {activeFirst.map((employee) => (
              <CarouselEmployeeCard key={employee.id} employee={employee} />
            ))}
            <CreateEmployeeCard onCreateClick={onCreateClick} />
          </>
        )}
      </div>
    </OverviewCard>
  );
}
