import type { ReactNode } from "react";

export type DashboardShellUser = {
  name: string;
  email: string;
  image?: string | null;
};

export type DashboardShellWorkspace = {
  organizationName: string;
  role: string;
  organizationType: string;
};

export type DashboardLayoutProps = {
  user: DashboardShellUser;
  workspace: DashboardShellWorkspace;
  children: ReactNode;
};
