import { and, eq } from "drizzle-orm";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { db } from "@/shared/db/client";

export async function revokeOrganizationInvite(input: {
  organizationId: string;
  inviteId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const [updated] = await db
    .update(organizationInvite)
    .set({ status: "revoked" })
    .where(
      and(
        eq(organizationInvite.id, input.inviteId),
        eq(organizationInvite.organizationId, input.organizationId),
        eq(organizationInvite.status, "pending"),
      ),
    )
    .returning({ id: organizationInvite.id });

  if (!updated) {
    return { ok: false, message: "Invite not found or already handled." };
  }

  return { ok: true };
}
