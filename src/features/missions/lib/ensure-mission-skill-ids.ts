import { getSkillBySlug } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { seedSystemBlueprintCatalog } from "@/features/agent-blueprint/services/seed-system-blueprint-catalog";
import type { MissionType } from "./mission-type";
import {
  qualificationProfileForMissionType,
  skillSlugForProfile,
} from "./mission-qualification-profile";

export async function ensureMissionSkillIds(input: {
  organizationId: string;
  type: MissionType;
  skillIds: string[];
}): Promise<string[]> {
  const profile = qualificationProfileForMissionType(input.type);
  if (profile === "generic") {
    return input.skillIds;
  }

  await seedSystemBlueprintCatalog();

  const slug = skillSlugForProfile(profile);
  const skillRow = await getSkillBySlug({
    organizationId: input.organizationId,
    slug,
  });

  if (!skillRow || input.skillIds.includes(skillRow.id)) {
    return input.skillIds;
  }

  return [...input.skillIds, skillRow.id];
}
