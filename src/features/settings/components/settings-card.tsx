import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  className,
  children,
  footer,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
