import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatProviderLabel } from "../lib/format-provider";

export function EmployeeProviderBadge({
  kind,
  provider,
  className,
}: {
  kind: "Avatar" | "Brain";
  provider: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-white/10 bg-white/2 font-normal text-white/70",
        className,
      )}
    >
      {kind} · {formatProviderLabel(provider)}
    </Badge>
  );
}
