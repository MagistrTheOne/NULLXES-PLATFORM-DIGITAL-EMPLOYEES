import { cn } from "@/lib/utils";
import { platformInsetBleedClass } from "@/shared/layout/platform-layout";

export default function EmployeeTalkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        platformInsetBleedClass,
      )}
    >
      {children}
    </div>
  );
}
