"use server";

import { eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { resolveWorkspace } from "@/features/workspace";
import type { WorkspaceContext } from "@/features/workspace";
import { db } from "@/shared/db/client";
import { provisionDefaultWorkspace } from "./provision-default-workspace";

export async function ensureWorkspace(
  userId: string,
  displayName: string,
): Promise<WorkspaceContext> {
  const existingMembership = await db
    .select({ id: membership.id })
    .from(membership)
    .where(eq(membership.userId, userId))
    .limit(1);

  if (existingMembership.length === 0) {
    await provisionDefaultWorkspace(userId, displayName);
  }

  return resolveWorkspace({ userId });
}
