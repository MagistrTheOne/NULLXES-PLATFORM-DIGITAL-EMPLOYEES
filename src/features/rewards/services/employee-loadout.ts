import "server-only";

import { and, eq } from "drizzle-orm";
import {
  employeeRewardLoadout,
  organizationRewardItem,
  rewardDefinition,
} from "@/entities/reward";
import {
  emptyLoadout,
  SKILL_SLOT_COUNT,
  type EmployeeLoadout,
} from "@/features/rewards/lib/loadout";
import { syncEmployeeSkillsFromChips } from "@/features/rewards/services/sync-skill-chip-skills";
import {
  applyVoicePackToEmployee,
  resolveVoicePackElevenLabsId,
} from "@/features/rewards/services/voice-pack-elevenlabs";
import { resolveCharacterGender } from "@/features/hq/lib/resolve-character-gender";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

function rowToLoadout(
  row: typeof employeeRewardLoadout.$inferSelect | undefined,
): EmployeeLoadout {
  if (!row) return emptyLoadout();
  // Appearance + skill chips temporarily hidden from loadouts.
  return {
    appearanceId: null,
    voiceId: row.voiceSlug,
    backgroundId: row.backgroundSlug,
    frameId: row.frameSlug,
    skillChipIds: Array.from({ length: SKILL_SLOT_COUNT }, () => null),
  };
}

export async function getEmployeeLoadout(input: {
  organizationId: string;
  employeeId: string;
}): Promise<EmployeeLoadout> {
  const rows = await db
    .select()
    .from(employeeRewardLoadout)
    .where(
      and(
        eq(employeeRewardLoadout.organizationId, input.organizationId),
        eq(employeeRewardLoadout.employeeId, input.employeeId),
      ),
    )
    .limit(1);
  return rowToLoadout(rows[0]);
}

export async function listOrganizationLoadouts(
  organizationId: string,
): Promise<Record<string, EmployeeLoadout>> {
  const rows = await db
    .select()
    .from(employeeRewardLoadout)
    .where(eq(employeeRewardLoadout.organizationId, organizationId));

  const map: Record<string, EmployeeLoadout> = {};
  for (const row of rows) {
    map[row.employeeId] = rowToLoadout(row);
  }
  return map;
}

async function assertOwned(
  organizationId: string,
  slug: string | null | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!slug) return { ok: true };
  const owned = await db
    .select()
    .from(organizationRewardItem)
    .where(
      and(
        eq(organizationRewardItem.organizationId, organizationId),
        eq(organizationRewardItem.rewardSlug, slug),
      ),
    )
    .limit(1);
  if (!owned[0] || owned[0].ownedCount < 1) {
    return { ok: false, message: `Reward not owned: ${slug}` };
  }
  return { ok: true };
}

async function assertType(
  slug: string | null | undefined,
  expected: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!slug) return { ok: true };
  const defs = await db
    .select()
    .from(rewardDefinition)
    .where(eq(rewardDefinition.slug, slug))
    .limit(1);
  if (!defs[0] || defs[0].type !== expected) {
    return { ok: false, message: `Invalid slot for ${slug}` };
  }
  return { ok: true };
}

export async function upsertEmployeeLoadout(input: {
  organizationId: string;
  employeeId: string;
  loadout: EmployeeLoadout;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  // Appearance + skill chips temporarily disabled — always clear on save.
  const loadout: EmployeeLoadout = {
    ...input.loadout,
    appearanceId: null,
    skillChipIds: Array.from({ length: SKILL_SLOT_COUNT }, () => null),
  };
  const previous = await getEmployeeLoadout({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
  });

  const checks = await Promise.all([
    assertOwned(input.organizationId, loadout.voiceId),
    assertOwned(input.organizationId, loadout.backgroundId),
    assertOwned(input.organizationId, loadout.frameId),
    assertType(loadout.voiceId, "voice"),
    assertType(loadout.backgroundId, "background"),
    assertType(loadout.frameId, "frame"),
  ]);

  for (const check of checks) {
    if (!check.ok) return check;
  }

  const existing = await db
    .select({ id: employeeRewardLoadout.id })
    .from(employeeRewardLoadout)
    .where(eq(employeeRewardLoadout.employeeId, input.employeeId))
    .limit(1);

  const values = {
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    appearanceSlug: null as string | null,
    voiceSlug: loadout.voiceId,
    backgroundSlug: loadout.backgroundId,
    frameSlug: loadout.frameId,
    skillChipSlugs: [] as string[],
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db
      .update(employeeRewardLoadout)
      .set(values)
      .where(eq(employeeRewardLoadout.id, existing[0].id));
  } else {
    await db.insert(employeeRewardLoadout).values(values);
  }

  await syncEmployeeSkillsFromChips({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    previousChipSlugs: previous.skillChipIds,
    nextChipSlugs: loadout.skillChipIds,
  });

  if (loadout.voiceId && loadout.voiceId !== previous.voiceId) {
    const voiceApplied = await applyEquippedVoicePack({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      rewardSlug: loadout.voiceId,
    });
    if (!voiceApplied.ok) return voiceApplied;
  }

  return { ok: true };
}

async function applyEquippedVoicePack(input: {
  organizationId: string;
  employeeId: string;
  rewardSlug: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const [employee] = await db
    .select({ name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);
  const gender = resolveCharacterGender(employee?.name ?? "Agent");
  const resolved = await resolveVoicePackElevenLabsId({
    rewardSlug: input.rewardSlug,
    gender,
  });
  if (!resolved.ok) return resolved;
  return applyVoicePackToEmployee({
    employeeId: input.employeeId,
    organizationId: input.organizationId,
    voiceId: resolved.voiceId,
    rewardSlug: input.rewardSlug,
  });
}

export async function equipRewardOnEmployee(input: {
  organizationId: string;
  employeeId: string;
  rewardSlug: string;
}): Promise<{ ok: true; loadout: EmployeeLoadout } | { ok: false; message: string }> {
  const owned = await assertOwned(input.organizationId, input.rewardSlug);
  if (!owned.ok) return owned;

  const defs = await db
    .select()
    .from(rewardDefinition)
    .where(eq(rewardDefinition.slug, input.rewardSlug))
    .limit(1);
  const def = defs[0];
  if (!def) {
    return { ok: false, message: "Unknown reward." };
  }
  if (def.type === "idle") {
    return { ok: false, message: "Idle rewards have been removed." };
  }
  if (def.type === "appearance" || def.type === "skill_chip") {
    return {
      ok: false,
      message: "Appearance and skill chips are temporarily unavailable.",
    };
  }

  const current = await getEmployeeLoadout(input);
  const next = {
    ...current,
    appearanceId: null,
    skillChipIds: Array.from({ length: SKILL_SLOT_COUNT }, () => null),
  };

  switch (def.type) {
    case "voice":
      next.voiceId = input.rewardSlug;
      break;
    case "background":
      next.backgroundId = input.rewardSlug;
      break;
    case "frame":
      next.frameId = input.rewardSlug;
      break;
    default:
      return { ok: false, message: "Unsupported reward type." };
  }

  const saved = await upsertEmployeeLoadout({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    loadout: next,
  });
  if (!saved.ok) return saved;
  return { ok: true, loadout: next };
}
