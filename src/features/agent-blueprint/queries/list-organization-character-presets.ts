import { and, asc, eq } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { db } from "@/shared/db/client";
import { isSystemBlueprintSeeded, seedSystemBlueprintCatalog } from "../services/seed-system-blueprint-catalog";

export async function listOrganizationCharacterPresets(organizationId: string) {
  if (!(await isSystemBlueprintSeeded())) {
    await seedSystemBlueprintCatalog();
  }

  return db
    .select()
    .from(characterPreset)
    .where(orgOrSystemScope(organizationId, characterPreset.organizationId))
    .orderBy(asc(characterPreset.isSystemTemplate), asc(characterPreset.name));
}

export async function getCharacterPresetDetail(input: {
  organizationId: string;
  presetId: string;
}) {
  const [row] = await db
    .select()
    .from(characterPreset)
    .where(
      and(
        eq(characterPreset.id, input.presetId),
        orgOrSystemScope(input.organizationId, characterPreset.organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}
