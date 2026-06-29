/**
 * OpenAI Assistants API only supports a subset of chat models.
 * GPT-5+ models must use Chat Completions / Responses at runtime instead.
 */
export function isOpenAiAssistantsCompatibleModel(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (/^gpt-5(?:[.-]|$)/.test(normalized)) {
    return false;
  }

  return true;
}

export function buildDirectOpenAiBrainResourceId(model: string): string {
  return `direct:${model.trim()}`;
}
