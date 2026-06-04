import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeKnowledgeItem } from "../types";

function statusLabel(status: EmployeeKnowledgeItem["status"]): string {
  return status.replace("_", " ");
}

export function EmployeeKnowledgePanel({
  items,
}: {
  items: EmployeeKnowledgeItem[];
}) {
  if (items.length === 0) {
    return (
      <Card className="border-white/10 bg-[#111111] py-0 text-white">
        <CardContent className="px-5 py-8 text-sm text-white/50">
          No knowledge sources attached to this employee yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">
          Knowledge sources ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-white/10 px-0 py-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {item.title}
              </p>
              <p className="mt-1 text-xs tracking-wide text-white/45 uppercase">
                {item.type} · {statusLabel(item.status)}
              </p>
              {item.failureReason ? (
                <p className="mt-2 text-xs text-white/55">
                  {item.failureReason}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-white/50 sm:items-end">
              <span>{item.chunkCount} chunks</span>
              <span>{format(item.createdAt, "MMM d, yyyy")}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
