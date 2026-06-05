import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";

export async function updateOrganizationProfile(input: {
  organizationId: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = input.name.trim();

  if (!name) {
    return { ok: false, message: "Organization name is required." };
  }

  const [updated] = await db
    .update(organization)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(organization.id, input.organizationId))
    .returning({ id: organization.id });

  if (!updated) {
    return { ok: false, message: "Organization was not found." };
  }

  return { ok: true };
}
