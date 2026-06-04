import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EmployeeListItem } from "../types";
import { EmployeeProviderBadges } from "./employee-provider-badges";
import { EmployeeStatusBadge } from "./employee-status-badge";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "DE";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function EmployeeCard({ employee }: { employee: EmployeeListItem }) {
  const createdLabel = format(employee.createdAt, "MMM d, yyyy");

  return (
    <Card className="border-white/10 bg-[#111111] py-5 text-white ring-white/10">
      <CardHeader className="px-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 border border-white/10">
              <AvatarFallback className="bg-white/[0.06] text-sm text-white">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-base font-medium text-white">
                {employee.name}
              </CardTitle>
              <CardDescription className="truncate text-white/60">
                {employee.role}
              </CardDescription>
            </div>
          </div>
          <EmployeeStatusBadge status={employee.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        <EmployeeProviderBadges
          avatarProvider={employee.avatarProvider}
          brainProvider={employee.brainProvider}
        />
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>
            {employee.knowledgeSourcesCount}{" "}
            {employee.knowledgeSourcesCount === 1
              ? "knowledge source"
              : "knowledge sources"}
          </span>
          <span>Created {createdLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
