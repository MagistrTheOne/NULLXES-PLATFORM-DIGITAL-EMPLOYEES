import { cn } from "@/lib/utils";
import { platformFullBleedClass } from "@/shared/layout/platform-layout";

export default function EmployeeTalkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", platformFullBleedClass)}>
      {children}
    </div>
  );
}
