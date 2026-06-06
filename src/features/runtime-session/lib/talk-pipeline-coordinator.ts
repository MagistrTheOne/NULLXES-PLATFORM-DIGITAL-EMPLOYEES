let inflightTurnKey: string | null = null;
let lastCompletedTurnKey: string | null = null;
let lastAssistantReply = "";
let lastAssistantReplyAt = 0;

const ECHO_WINDOW_MS = 60_000;

export function normalizeTalkText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildTalkTurnKey(userText: string): string {
  return `turn:${normalizeTalkText(userText)}`;
}

export function resetTalkPipelineCoordinator(): void {
  inflightTurnKey = null;
  lastCompletedTurnKey = null;
  lastAssistantReply = "";
  lastAssistantReplyAt = 0;
}

export function tryBeginTalkTurn(turnKey: string): boolean {
  if (inflightTurnKey) {
    return false;
  }

  if (turnKey === lastCompletedTurnKey) {
    return false;
  }

  inflightTurnKey = turnKey;
  return true;
}

export function completeTalkTurn(turnKey: string, assistantReply: string): void {
  inflightTurnKey = null;
  lastCompletedTurnKey = turnKey;
  lastAssistantReply = normalizeTalkText(assistantReply);
  lastAssistantReplyAt = Date.now();
}

export function failTalkTurn(): void {
  inflightTurnKey = null;
}

/** Skip STT picking up the avatar's own spoken reply through the mic. */
export function isLikelyAssistantEcho(userText: string): boolean {
  if (!lastAssistantReply || Date.now() - lastAssistantReplyAt > ECHO_WINDOW_MS) {
    return false;
  }

  const normalized = normalizeTalkText(userText);
  if (!normalized) {
    return false;
  }

  if (normalized === lastAssistantReply) {
    return true;
  }

  const snippetLength = Math.min(48, lastAssistantReply.length, normalized.length);
  if (snippetLength < 16) {
    return false;
  }

  const assistantSnippet = lastAssistantReply.slice(0, snippetLength);
  const userSnippet = normalized.slice(0, snippetLength);

  return (
    lastAssistantReply.includes(normalized) ||
    normalized.includes(lastAssistantReply) ||
    assistantSnippet === userSnippet
  );
}