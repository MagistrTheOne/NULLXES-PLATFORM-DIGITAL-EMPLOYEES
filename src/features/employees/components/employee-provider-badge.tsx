import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatProviderLabel } from "../lib/format-provider";

export function EmployeeProviderBadge({
  kind,
  provider,
  className,
}: {
  kind: "Avatar" | "Brain" | "Voice";
  provider: string;
  className?: string;
}) {
  const debugLabel = `${kind} · ${formatProviderLabel(provider)}`;

  return (
    <Badge
      variant="outline"
      data-provider={provider}
      data-debug-label={debugLabel}
      className={cn(
        "rounded-md border-white/10 bg-white/2 font-normal text-white/70",
        className,
      )}
    >
      {kind}
    </Badge>
  );
}
