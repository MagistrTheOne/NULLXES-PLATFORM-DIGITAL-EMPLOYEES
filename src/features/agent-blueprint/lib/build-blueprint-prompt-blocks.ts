import type { SkillProficiency } from "@/entities/skill/types";

export function appendCharacterBlock(
  systemPrompt: string,
  characterPromptBlock: string | null | undefined,
): string {
  if (!characterPromptBlock?.trim()) {
    return systemPrompt;
  }

  return `${systemPrompt}\n\n${characterPromptBlock.trim()}`;
}

export function appendSkillsBlock(
  systemPrompt: string,
  skills: Array<{ promptBlock: string; proficiency: SkillProficiency }>,
): string {
  if (skills.length === 0) {
    return systemPrompt;
  }

  const blocks = skills
    .map((skill) => skill.promptBlock.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!blocks) {
    return systemPrompt;
  }

  return `${systemPrompt}\n\nActive skills:\n${blocks}`;
}
