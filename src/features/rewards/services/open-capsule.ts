import "server-only";

import { and, eq, sql } from "drizzle-orm";
import {
  capsuleOpenEvent,
  organizationCapsuleHolding,
} from "@/entities/reward";
import type { CapsuleTierId } from "@/features/rewards/lib/catalog";
import {
  grantRolledReward,
  type GrantedReward,
} from "@/features/rewards/services/grant-reward";
import { ensureRewardsCatalogSeeded } from "@/features/rewards/services/get-rewards-workspace-state";
import { db } from "@/shared/db/client";

export type OpenCapsuleResult =
  | { ok: true; reward: GrantedReward }
  | { ok: false; message: string };

export async function openCapsuleFromHolding(input: {
  organizationId: string;
  tierId: CapsuleTierId;
}): Promise<OpenCapsuleResult> {
  if (input.tierId === "daily") {
    return { ok: false, message: "Use daily claim for Base Capsule." };
  }

  await ensureRewardsCatalogSeeded();

  const holdings = await db
    .select()
    .from(organizationCapsuleHolding)
    .where(
      and(
        eq(organizationCapsuleHolding.organizationId, input.organizationId),
        eq(organizationCapsuleHolding.tierId, input.tierId),
      ),
    )
    .limit(1);

  const holding = holdings[0];
  if (!holding || holding.ownedCount < 1) {
    return { ok: false, message: "No owned capsule to open." };
  }

  const reward = await grantRolledReward({
    organizationId: input.organizationId,
    tierId: input.tierId,
  });
  if (!reward) {
    return { ok: false, message: "Reward catalog is empty." };
  }

  await db
    .update(organizationCapsuleHolding)
    .set({
      ownedCount: Math.max(holding.ownedCount - 1, 0),
      updatedAt: new Date(),
    })
    .where(eq(organizationCapsuleHolding.id, holding.id));

  await db.insert(capsuleOpenEvent).values({
    organizationId: input.organizationId,
    tierId: input.tierId,
    source: "holding",
    rewardSlug: reward.slug,
  });

  return { ok: true, reward };
}

export async function recordCapsuleOpenEvent(input: {
  organizationId: string;
  tierId: CapsuleTierId;
  source: "daily" | "purchase" | "holding";
  rewardSlug: string;
  paymentOrderId?: string | null;
}): Promise<void> {
  await db.insert(capsuleOpenEvent).values({
    organizationId: input.organizationId,
    tierId: input.tierId,
    source: input.source,
    rewardSlug: input.rewardSlug,
    paymentOrderId: input.paymentOrderId ?? null,
  });
}

export async function grantCapsuleHolding(input: {
  organizationId: string;
  tierId: CapsuleTierId;
  amount?: number;
}): Promise<void> {
  const amount = input.amount ?? 1;
  const existing = await db
    .select()
    .from(organizationCapsuleHolding)
    .where(
      and(
        eq(organizationCapsuleHolding.organizationId, input.organizationId),
        eq(organizationCapsuleHolding.tierId, input.tierId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(organizationCapsuleHolding)
      .set({
        ownedCount: sql`${organizationCapsuleHolding.ownedCount} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(organizationCapsuleHolding.id, existing[0].id));
    return;
  }

  await db.insert(organizationCapsuleHolding).values({
    organizationId: input.organizationId,
    tierId: input.tierId,
    ownedCount: amount,
  });
}
