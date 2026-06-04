import { requireAuth } from "@/features/auth/services/require-auth";
import { DashboardLayout } from "@/features/dashboard";
import type {
  DashboardShellUser,
  DashboardShellWorkspace,
} from "@/features/dashboard/types";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";

export default async function DashboardRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(
    session.user.id,
    session.user.name,
  );

  const user: DashboardShellUser = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  const workspaceShell: DashboardShellWorkspace = {
    organizationName: workspace.organization.name,
    role: workspace.membership.role,
    organizationType: workspace.organization.type,
  };

  return (
    <DashboardLayout user={user} workspace={workspaceShell}>
      {children}
    </DashboardLayout>
  );
}
