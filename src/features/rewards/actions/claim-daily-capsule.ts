"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { claimDailyCapsule } from "@/features/rewards/services/claim-daily-capsule";
import type { RewardRarity } from "@/features/rewards/lib/catalog";

export type ClaimDailyCapsuleActionResult =
  | {
      ok: true;
      reward: { slug: string; name: string; rarity: RewardRarity };
      nextAvailableAt: string;
    }
  | { ok: false; message: string; secondsLeft?: number };

export async function claimDailyCapsuleAction(): Promise<ClaimDailyCapsuleActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );
    const result = await claimDailyCapsule(workspace.organization.id);
    if (!result.ok) {
      return result;
    }

    revalidatePath("/dashboard/capsules");
    revalidatePath("/dashboard/inventory");

    return {
      ok: true,
      reward: result.reward,
      nextAvailableAt: result.nextAvailableAt.toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to claim daily capsule",
    };
  }
}
