"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { CapsuleTierId, RewardRarity } from "@/features/rewards/lib/catalog";
import { openCapsuleFromHolding } from "@/features/rewards/services/open-capsule";

export type OpenCapsuleActionResult =
  | {
      ok: true;
      reward: { slug: string; name: string; rarity: RewardRarity };
    }
  | { ok: false; message: string };

export async function openCapsuleAction(
  tierId: CapsuleTierId,
): Promise<OpenCapsuleActionResult> {
  try {
    if (tierId !== "standard" && tierId !== "executive") {
      return { ok: false, message: "Invalid capsule tier." };
    }

    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );
    const result = await openCapsuleFromHolding({
      organizationId: workspace.organization.id,
      tierId,
    });
    if (!result.ok) {
      return result;
    }

    revalidatePath("/dashboard/capsules");
    revalidatePath("/dashboard/inventory");
    return { ok: true, reward: result.reward };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to open capsule",
    };
  }
}
