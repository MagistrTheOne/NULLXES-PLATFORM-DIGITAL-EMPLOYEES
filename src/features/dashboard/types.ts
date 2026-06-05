import type { ReactNode } from "react";
import type { UserBillingSnapshot } from "@/features/billing/services/get-user-billing-snapshot";

export type DashboardShellUser = {
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

export type DashboardShellWorkspace = {
  organizationId: string;
  organizationName: string;
  role: string;
  organizationType: string;
  billing: UserBillingSnapshot;
};

export type DashboardLayoutProps = {
  user: DashboardShellUser;
  workspace: DashboardShellWorkspace;
  children: ReactNode;
};
