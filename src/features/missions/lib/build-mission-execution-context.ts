export function buildMissionExecutionContext(input: {
  brief: string;
  goal?: string | null;
  skills?: string[] | null;
}): string {
  const parts = [`Mission brief: ${input.brief}`];

  if (input.goal?.trim()) {
    parts.unshift(`Mission goal: ${input.goal.trim()}`);
  }

  if (input.skills?.length) {
    parts.push(`Required skills: ${input.skills.join(", ")}`);
  }

  return parts.join("\n");
}
