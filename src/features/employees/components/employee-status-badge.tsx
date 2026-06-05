import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/entities/digital-employee";

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  draft: "border-white/20 bg-white/3 text-white/50",
  active: "border-white/20 bg-white/6 text-white",
  paused: "border-white/15 bg-white/4 text-white/70",
  archived: "border-white/10 bg-transparent text-white/40",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const t = useTranslations("employees.status");

  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-normal", STATUS_CLASS[status])}
    >
      {t(status)}
    </Badge>
  );
}
