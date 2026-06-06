import { eq } from "drizzle-orm";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { user } from "@/entities/user/schema";
import type { MembershipRole } from "@/features/workspace/types";
import { db } from "@/shared/db/client";

export class TwoFactorRequiredError extends Error {
  constructor() {
    super(
      "Two-factor authentication is required for administrators in this organization.",
    );
    this.name = "TwoFactorRequiredError";
  }
}

export async function assertTwoFactorForSensitiveAction(input: {
  userId: string;
  role: MembershipRole;
  organizationId: string;
}): Promise<void> {
  if (input.role !== "owner" && input.role !== "admin") {
    return;
  }

  const settings = await ensureOrganizationSettings(input.organizationId);
  if (!settings.requireTwoFactorForAdmins) {
    return;
  }

  const [userRow] = await db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  if (!userRow?.twoFactorEnabled) {
    throw new TwoFactorRequiredError();
  }
}
