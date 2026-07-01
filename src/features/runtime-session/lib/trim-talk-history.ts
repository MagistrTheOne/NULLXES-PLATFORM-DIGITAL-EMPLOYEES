/**
 * Live Talk keeps only the most recent turns: the prompt stays small, the LLM
 * time-to-first-token stays low, and old context matters little in voice chat.
 */
const TALK_HISTORY_MAX_MESSAGES = 12;

export function trimTalkHistory<T>(messages: T[]): T[] {
  if (messages.length <= TALK_HISTORY_MAX_MESSAGES) {
    return messages;
  }
  return messages.slice(-TALK_HISTORY_MAX_MESSAGES);
}
