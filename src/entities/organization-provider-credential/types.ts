import type { organizationProviderEnum } from "./schema";

export type OrganizationProvider =
  (typeof organizationProviderEnum.enumValues)[number];
