const ECHO_WINDOW_MS = 60_000;

export function normalizeTalkText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildTalkTurnKey(userText: string): string {
  return `turn:${normalizeTalkText(userText)}`;
}

export class TalkPipelineCoordinator {
  private inflightTurnKey: string | null = null;
  private lastCompletedTurnKey: string | null = null;
  private lastAssistantReply = "";
  private lastAssistantReplyAt = 0;

  reset(): void {
    this.inflightTurnKey = null;
    this.lastCompletedTurnKey = null;
    this.lastAssistantReply = "";
    this.lastAssistantReplyAt = 0;
  }

  tryBeginTalkTurn(turnKey: string): boolean {
    if (this.inflightTurnKey) {
      return false;
    }

    if (turnKey === this.lastCompletedTurnKey) {
      return false;
    }

    this.inflightTurnKey = turnKey;
    return true;
  }

  completeTalkTurn(turnKey: string, assistantReply: string): void {
    this.inflightTurnKey = null;
    this.lastCompletedTurnKey = turnKey;
    this.lastAssistantReply = normalizeTalkText(assistantReply);
    this.lastAssistantReplyAt = Date.now();
  }

  failTalkTurn(): void {
    this.inflightTurnKey = null;
  }

  /** Skip STT picking up the avatar's own spoken reply through the mic. */
  isLikelyAssistantEcho(userText: string): boolean {
    if (
      !this.lastAssistantReply ||
      Date.now() - this.lastAssistantReplyAt > ECHO_WINDOW_MS
    ) {
      return false;
    }

    const normalized = normalizeTalkText(userText);
    if (!normalized) {
      return false;
    }

    if (normalized === this.lastAssistantReply) {
      return true;
    }

    const snippetLength = Math.min(
      48,
      this.lastAssistantReply.length,
      normalized.length,
    );
    if (snippetLength < 16) {
      return false;
    }

    const assistantSnippet = this.lastAssistantReply.slice(0, snippetLength);
    const userSnippet = normalized.slice(0, snippetLength);

    return (
      this.lastAssistantReply.includes(normalized) ||
      normalized.includes(this.lastAssistantReply) ||
      assistantSnippet === userSnippet
    );
  }
}

const coordinators = new Map<string, TalkPipelineCoordinator>();

export function getTalkPipelineCoordinator(
  employeeId: string,
): TalkPipelineCoordinator {
  let coordinator = coordinators.get(employeeId);
  if (!coordinator) {
    coordinator = new TalkPipelineCoordinator();
    coordinators.set(employeeId, coordinator);
  }
  return coordinator;
}

export function resetTalkPipelineCoordinator(employeeId: string): void {
  coordinators.get(employeeId)?.reset();
}

export function releaseTalkPipelineCoordinator(employeeId: string): void {
  coordinators.delete(employeeId);
}
