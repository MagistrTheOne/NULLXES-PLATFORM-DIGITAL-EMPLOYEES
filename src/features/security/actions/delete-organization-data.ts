"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { organization } from "@/entities/organization/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { db } from "@/shared/db/client";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "../services/assert-two-factor-for-sensitive-action";
import { recordAuditEvent } from "../services/record-audit-event";

export type DeleteOrganizationDataResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteOrganizationDataAction(): Promise<DeleteOrganizationDataResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (workspace.membership.role !== "owner") {
    return {
      ok: false,
      message: "Only organization owners can delete workspace data.",
    };
  }

  try {
    await assertTwoFactorForSensitiveAction({
      userId: session.user.id,
      role: workspace.membership.role,
      organizationId: workspace.organization.id,
    });
  } catch (error: unknown) {
    if (error instanceof TwoFactorRequiredError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  recordAuditEvent({
    organizationId: workspace.organization.id,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "org.data_deletion.requested",
    resourceType: "organization",
    resourceId: workspace.organization.id,
  });

  await db
    .delete(organization)
    .where(eq(organization.id, workspace.organization.id));

  revalidatePath("/settings");
  return { ok: true };
}
