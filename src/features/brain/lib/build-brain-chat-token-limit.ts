/** OpenAI reasoning / GPT-5 models reject legacy `max_tokens` on chat completions. */
export function usesMaxCompletionTokens(model: string): boolean {
  const normalized = model.trim().toLowerCase();

  return (
    normalized.startsWith("gpt-5") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4")
  );
}

export function buildBrainChatTokenLimit(
  model: string,
  maxTokens: number,
): { max_tokens: number } | { max_completion_tokens: number } {
  if (usesMaxCompletionTokens(model)) {
    return { max_completion_tokens: maxTokens };
  }

  return { max_tokens: maxTokens };
}
