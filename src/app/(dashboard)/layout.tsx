import { requireAuth } from "@/features/auth/services/require-auth";
import { getUserBillingSnapshot } from "@/features/billing/services/get-user-billing-snapshot";
import { DashboardLayout } from "@/features/dashboard";
import type {
  DashboardShellUser,
  DashboardShellWorkspace,
} from "@/features/dashboard/types";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { loadMessages } from "@/i18n/load-messages";
import { getRequestLocale } from "@/i18n/request";
import { IntlProvider } from "@/shared/i18n/intl-provider";

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
    role: workspace.membership.role,
    image: session.user.image,
  };

  const workspaceShell: DashboardShellWorkspace = {
    organizationId: workspace.organization.id,
    organizationName: workspace.organization.name,
    role: workspace.membership.role,
    organizationType: workspace.organization.type,
    billing: getUserBillingSnapshot({
      organizationId: workspace.organization.id,
      billingPlan: workspace.organization.billingPlan,
      canManageOrganization: workspace.permissions.canManageOrganization,
      customerEmail: session.user.email,
    }),
  };

  const locale = await getRequestLocale();
  const messages = loadMessages(locale);

  return (
    <IntlProvider locale={locale} messages={messages}>
      <DashboardLayout user={user} workspace={workspaceShell}>
        {children}
      </DashboardLayout>
    </IntlProvider>
  );
}
