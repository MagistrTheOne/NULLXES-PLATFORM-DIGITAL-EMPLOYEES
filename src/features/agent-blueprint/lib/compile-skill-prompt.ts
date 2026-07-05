import type { SkillProficiency, SkillTriggers } from "@/entities/skill/types";

export function compileSkillPromptBlock(input: {
  name: string;
  instructions: string;
  triggers: SkillTriggers;
  requiredToolSlugs: string[];
  proficiency: SkillProficiency;
}): string {
  const triggerParts = [
    input.triggers.keywords.length > 0
      ? `keywords: ${input.triggers.keywords.join(", ")}`
      : null,
    input.triggers.intents.length > 0
      ? `intents: ${input.triggers.intents.join(", ")}`
      : null,
  ].filter(Boolean);

  return [
    `Skill — ${input.name} (${input.proficiency}):`,
    triggerParts.length > 0 ? `Apply when: ${triggerParts.join("; ")}` : null,
    input.requiredToolSlugs.length > 0
      ? `Required tools: ${input.requiredToolSlugs.join(", ")}`
      : null,
    "Procedure:",
    input.instructions.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}
