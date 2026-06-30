import { sendTalkChatBotMessageAction } from "../actions/send-talk-chat-bot-message";

let activeEmployeeId: string | null = null;
let lastPostedReply: { normalized: string; at: number } | null = null;

const REPLY_DEDUP_WINDOW_MS = 15_000;

function normalizeReplyText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function registerTalkChatBridge(input: {
  employeeId: string | null;
}): void {
  activeEmployeeId = input.employeeId;
}

export function resetTalkChatReplyDedup(): void {
  lastPostedReply = null;
}

export async function postTalkEmployeeChatReply(
  text: string,
): Promise<string | null> {
  if (!activeEmployeeId || !text.trim()) {
    return null;
  }

  const trimmed = text.trim();
  const normalized = normalizeReplyText(trimmed);
  const now = Date.now();

  if (
    lastPostedReply &&
    lastPostedReply.normalized === normalized &&
    now - lastPostedReply.at < REPLY_DEDUP_WINDOW_MS
  ) {
    return null;
  }

  lastPostedReply = { normalized, at: now };

  const result = await sendTalkChatBotMessageAction(activeEmployeeId, trimmed).catch(
    () => ({ ok: false as const, message: "Failed to send reply" }),
  );

  if (result.ok) {
    return result.messageId;
  }

  return null;
}
