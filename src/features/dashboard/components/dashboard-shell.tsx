import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { isPlatformAdminEmail } from "@/features/admin";
import { getUserBillingSnapshot } from "@/features/billing/services/get-user-billing-snapshot";
import { syncOrganizationPolarBilling } from "@/features/billing/services/sync-organization-polar-billing";
import { DashboardLayout } from "@/features/dashboard";
import type {
  DashboardShellUser,
  DashboardShellWorkspace,
} from "@/features/dashboard/types";
import { getOrganizationDisplayPreferences } from "@/features/workspace/services/get-organization-display-preferences";
import { DEFAULT_ORGANIZATION_DISPLAY_PREFERENCES } from "@/features/workspace/types/display-preferences";
import { getCurrentSession } from "@/features/auth/services/get-current-session";

export async function DashboardShell({
  session,
  children,
}: Readonly<{
  session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;
  children: React.ReactNode;
}>) {
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const billingSync = await syncOrganizationPolarBilling(workspace.organization.id);

  const user: DashboardShellUser = {
    name: session.user.name,
    email: session.user.email,
    role: workspace.membership.role,
    image: session.user.image,
  };

  const workspaceShell: DashboardShellWorkspace = {
    organizationId: workspace.organization.id,
    organizationName: workspace.organization.name,
    role: workspace.membership.role,
    organizationType: workspace.organization.type,
    billing: await getUserBillingSnapshot({
      organizationId: workspace.organization.id,
      billingPlan: billingSync.billingPlan,
      canManageOrganization: workspace.permissions.canManageOrganization,
      customerEmail: session.user.email,
    }),
  };

  let displayPreferences = DEFAULT_ORGANIZATION_DISPLAY_PREFERENCES;

  try {
    displayPreferences = await getOrganizationDisplayPreferences(
      workspace.organization.id,
    );
  } catch {
    // Settings page surfaces migration errors; keep the shell usable.
  }

  return (
    <DashboardLayout
      user={user}
      workspace={workspaceShell}
      permissions={workspace.permissions}
      displayPreferences={displayPreferences}
      isPlatformAdmin={isPlatformAdminEmail(session.user.email)}
    >
      {children}
    </DashboardLayout>
  );
}
