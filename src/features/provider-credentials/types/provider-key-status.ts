import type { OrganizationProvider } from "@/entities/organization-provider-credential";

export type ProviderKeyStatus = {
  provider: OrganizationProvider;
  source: "organization" | "platform" | "none";
  last4: string | null;
  updatedAt: Date | null;
};
