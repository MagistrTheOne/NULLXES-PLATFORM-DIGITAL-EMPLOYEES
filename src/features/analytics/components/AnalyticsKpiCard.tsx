import { cn } from "@/lib/utils";

export function AnalyticsKpiCard({
  title,
  value,
  detail,
  className,
}: {
  title: string;
  value: string;
  detail: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[132px] flex-col justify-between rounded-2xl border border-border bg-card px-5 py-4 text-card-foreground",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-medium tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}
