"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { createApiKey } from "../services/api-key";

export async function createApiKeyAction(input: {
  name: string;
}): Promise<
  { ok: true; rawKey: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "Only organization owners can create API keys." };
  }

  const result = await createApiKey({
    organizationId: workspace.organization.id,
    name: input.name,
    createdByUserId: session.user.id,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/settings");
  return { ok: true, rawKey: result.rawKey };
}
