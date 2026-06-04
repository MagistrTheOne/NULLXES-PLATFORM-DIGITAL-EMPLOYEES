import { format } from "date-fns";
import { UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployeeListItem } from "../types";
import { EmployeeProviderBadge } from "./employee-provider-badge";
import { EmployeeStatusBadge } from "./employee-status-badge";

export function EmployeeCard({ employee }: { employee: EmployeeListItem }) {
  const createdLabel = format(employee.createdAt, "MMM d, yyyy");

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden border-white/10 bg-[#111111] py-0 text-white ring-white/10">
      <div className="flex aspect-4/3 items-center justify-center border-b border-white/10 bg-white/3">
        <div className="flex flex-col items-center gap-2 text-white/40">
          <UserRound className="size-8 stroke-[1.25]" />
          <span className="text-xs tracking-wide uppercase">Avatar preview</span>
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-white">
              {employee.name}
            </h3>
            <p className="truncate text-sm text-white/60">{employee.role}</p>
          </div>
          <EmployeeStatusBadge status={employee.status} />
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <EmployeeProviderBadge
              kind="Avatar"
              provider={employee.avatarProvider}
            />
            <EmployeeProviderBadge kind="Brain" provider={employee.brainProvider} />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-white/50">
            <span className="whitespace-nowrap">
              {employee.knowledgeSourcesCount}{" "}
              {employee.knowledgeSourcesCount === 1 ? "source" : "sources"}
            </span>
            <span className="whitespace-nowrap">{createdLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
