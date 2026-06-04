import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/entities/digital-employee";

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  draft: "border-white/20 bg-white/3 text-white/50",
  active: "border-white/20 bg-white/6 text-white",
  paused: "border-white/15 bg-white/4 text-white/70",
  archived: "border-white/10 bg-transparent text-white/40",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-normal", STATUS_CLASS[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
