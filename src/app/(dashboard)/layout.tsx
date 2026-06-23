import { Suspense } from "react";
import { requireAuth } from "@/features/auth/services/require-auth";
import { DashboardLayoutSkeleton } from "@/features/dashboard/components/dashboard-layout-skeleton";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default async function DashboardRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();

  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardShell session={session}>{children}</DashboardShell>
    </Suspense>
  );
}
