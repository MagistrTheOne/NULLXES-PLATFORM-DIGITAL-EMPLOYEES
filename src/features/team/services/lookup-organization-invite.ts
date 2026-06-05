import { and, eq } from "drizzle-orm";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { db } from "@/shared/db/client";
import { hashInviteToken } from "../lib/hash-invite-token";

export type OrganizationInvitePreview = {
  inviteId: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
};

export async function lookupOrganizationInviteByToken(
  token: string,
): Promise<OrganizationInvitePreview | null> {
  const tokenHash = hashInviteToken(token.trim());

  const row = await db.query.organizationInvite.findFirst({
    where: and(
      eq(organizationInvite.tokenHash, tokenHash),
      eq(organizationInvite.status, "pending"),
    ),
    with: { organization: true },
  });

  if (!row?.organization || row.expiresAt < new Date()) {
    return null;
  }

  return {
    inviteId: row.id,
    email: row.email,
    role: row.role,
    organizationId: row.organizationId,
    organizationName: row.organization.name,
  };
}
