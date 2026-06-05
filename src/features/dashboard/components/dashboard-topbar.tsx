import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardTopbar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-white/10 bg-black px-4">
      <SidebarTrigger className="text-white hover:bg-white/5 hover:text-white" />
    </header>
  );
}
