import "server-only";

import {
  assignEmployeeSkills,
  removeEmployeeSkill,
} from "@/features/agent-blueprint/services/assign-employee-skills";
import { getSkillBySlug } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { linkedSkillSlugForChip } from "@/features/rewards/lib/skill-chip-links";

function uniqueSkillSlugs(chipSlugs: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const chip of chipSlugs) {
    const skillSlug = linkedSkillSlugForChip(chip);
    if (skillSlug) set.add(skillSlug);
  }
  return [...set];
}

/**
 * Diff equipped skill chips and assign/remove matching blueprint skills.
 */
export async function syncEmployeeSkillsFromChips(input: {
  organizationId: string;
  employeeId: string;
  previousChipSlugs: Array<string | null | undefined>;
  nextChipSlugs: Array<string | null | undefined>;
}): Promise<void> {
  const prevSkills = new Set(uniqueSkillSlugs(input.previousChipSlugs));
  const nextSkills = new Set(uniqueSkillSlugs(input.nextChipSlugs));

  const toAdd = [...nextSkills].filter((slug) => !prevSkills.has(slug));
  const toRemove = [...prevSkills].filter((slug) => !nextSkills.has(slug));

  if (toAdd.length > 0) {
    const assignments: Array<{ skillId: string }> = [];
    for (const slug of toAdd) {
      const row = await getSkillBySlug({
        organizationId: input.organizationId,
        slug,
      });
      if (row) assignments.push({ skillId: row.id });
    }
    if (assignments.length > 0) {
      await assignEmployeeSkills({
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        assignments,
      });
    }
  }

  for (const slug of toRemove) {
    const row = await getSkillBySlug({
      organizationId: input.organizationId,
      slug,
    });
    if (!row) continue;
    await removeEmployeeSkill({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      skillId: row.id,
    });
  }
}
