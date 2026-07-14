import "server-only";

import { eq } from "drizzle-orm";
import { organizationDailyCapsule } from "@/entities/reward";
import {
  grantRolledReward,
  type GrantedReward,
} from "@/features/rewards/services/grant-reward";
import { ensureRewardsCatalogSeeded } from "@/features/rewards/services/get-rewards-workspace-state";
import { recordCapsuleOpenEvent } from "@/features/rewards/services/open-capsule";
import { db } from "@/shared/db/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ClaimDailyCapsuleResult =
  | { ok: true; reward: GrantedReward; nextAvailableAt: Date }
  | { ok: false; message: string; secondsLeft?: number };

export async function claimDailyCapsule(
  organizationId: string,
): Promise<ClaimDailyCapsuleResult> {
  await ensureRewardsCatalogSeeded();

  const rows = await db
    .select()
    .from(organizationDailyCapsule)
    .where(eq(organizationDailyCapsule.organizationId, organizationId))
    .limit(1);

  const now = new Date();
  let row = rows[0];

  if (!row) {
    const [inserted] = await db
      .insert(organizationDailyCapsule)
      .values({
        organizationId,
        lastClaimedAt: null,
        nextAvailableAt: null,
      })
      .returning();
    row = inserted;
  }

  if (!row) {
    return { ok: false, message: "Unable to initialize daily capsule." };
  }

  if (row.nextAvailableAt && row.nextAvailableAt.getTime() > now.getTime()) {
    const secondsLeft = Math.ceil(
      (row.nextAvailableAt.getTime() - now.getTime()) / 1000,
    );
    return {
      ok: false,
      message: "Daily capsule already claimed.",
      secondsLeft,
    };
  }

  const reward = await grantRolledReward({
    organizationId,
    tierId: "daily",
  });

  if (!reward) {
    return { ok: false, message: "Reward catalog is empty." };
  }

  const nextAvailableAt = new Date(now.getTime() + DAY_MS);

  await db
    .update(organizationDailyCapsule)
    .set({
      lastClaimedAt: now,
      nextAvailableAt,
      updatedAt: now,
    })
    .where(eq(organizationDailyCapsule.id, row.id));

  await recordCapsuleOpenEvent({
    organizationId,
    tierId: "daily",
    source: "daily",
    rewardSlug: reward.slug,
  });

  return { ok: true, reward, nextAvailableAt };
}
