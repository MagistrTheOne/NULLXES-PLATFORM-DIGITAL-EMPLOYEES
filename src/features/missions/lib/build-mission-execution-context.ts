export function buildMissionExecutionContext(input: {
  brief: string;
  goal?: string | null;
  skills?: string[] | null;
  skillPromptBlocks?: string[];
}): string {
  const parts = [`Mission brief: ${input.brief}`];

  if (input.goal?.trim()) {
    parts.unshift(`Mission goal: ${input.goal.trim()}`);
  }

  if (input.skills?.length) {
    parts.push(`Required skills: ${input.skills.join(", ")}`);
  }

  if (input.skillPromptBlocks?.length) {
    parts.push("Skill procedures:\n" + input.skillPromptBlocks.join("\n\n"));
  }

  return parts.join("\n");
}
