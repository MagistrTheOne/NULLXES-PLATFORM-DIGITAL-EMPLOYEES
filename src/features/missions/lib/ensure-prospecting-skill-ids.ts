import { getSkillBySlug } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { seedSystemBlueprintCatalog } from "@/features/agent-blueprint/services/seed-system-blueprint-catalog";
import { RU_MARKET_QUALIFICATION_SLUG } from "./mission-qualification-mode";

export async function ensureProspectingSkillIds(input: {
  organizationId: string;
  type: "prospecting" | "custom";
  skillIds: string[];
}): Promise<string[]> {
  if (input.type !== "prospecting") {
    return input.skillIds;
  }

  await seedSystemBlueprintCatalog();

  const ruSkill = await getSkillBySlug({
    organizationId: input.organizationId,
    slug: RU_MARKET_QUALIFICATION_SLUG,
  });

  if (!ruSkill || input.skillIds.includes(ruSkill.id)) {
    return input.skillIds;
  }

  return [...input.skillIds, ruSkill.id];
}
