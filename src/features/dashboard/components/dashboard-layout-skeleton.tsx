import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { dashboardSidebarCssVars } from "../constants";

export function DashboardLayoutSkeleton() {
  return (
    <SidebarProvider
      defaultOpen
      style={dashboardSidebarCssVars}
      className="min-h-svh bg-black text-white"
    >
      <div className="hidden w-[280px] shrink-0 border-r border-white/10 bg-[#0a0a0a] lg:block" />
      <SidebarInset className="flex min-h-svh min-w-0 flex-1 flex-col bg-black">
        <div className="h-14 border-b border-white/10 bg-black" />
        <div className="mx-auto flex w-full max-w-[1760px] min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 2xl:px-8">
          <div className="space-y-3">
            <div className="h-8 w-48 animate-pulse rounded-md bg-white/8" />
            <div className="h-4 w-72 animate-pulse rounded-md bg-white/5" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/3"
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
