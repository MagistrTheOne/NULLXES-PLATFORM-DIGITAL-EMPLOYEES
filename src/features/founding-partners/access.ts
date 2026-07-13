import "server-only";

import { sanitizeEnvValue } from "@/shared/config/env";

/**
 * Closed Founding Partners program — invite / whitelist only.
 * Set FOUNDING_PARTNER_ORG_IDS=uuid,uuid (comma-separated).
 */
export function getFoundingPartnerOrgIds(): Set<string> {
  const raw = sanitizeEnvValue(process.env.FOUNDING_PARTNER_ORG_IDS);
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

export function isFoundingPartnerOrganization(
  organizationId: string | null | undefined,
): boolean {
  if (!organizationId) return false;
  return getFoundingPartnerOrgIds().has(organizationId);
}

export const FOUNDING_PARTNERS_PATH = "/enterprise/founding-partners";
export const FOUNDING_PARTNERS_CONTACT = "mailto:ceo@nullxes.com?subject=NULLXES%20Founding%20Partners";
