/**
 * Skill chip reward slug → Agent Blueprint system skill slug.
 * Source of truth for equip → employee_skill assignment (no extra DB column).
 */
export const SKILL_CHIP_LINKED_SKILL: Record<string, string> = {
  "neg-mastery": "objection_handling",
  "sales-eff": "b2b_discovery",
  "knowledge-recall": "knowledge_first_answer",
  "support-spec": "support_escalation",
};

export function linkedSkillSlugForChip(
  rewardSlug: string | null | undefined,
): string | null {
  if (!rewardSlug) return null;
  return SKILL_CHIP_LINKED_SKILL[rewardSlug] ?? null;
}
