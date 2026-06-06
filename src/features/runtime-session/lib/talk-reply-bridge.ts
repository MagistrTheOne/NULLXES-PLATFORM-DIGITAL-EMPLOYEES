import type { Channel as StreamChannel } from "stream-chat";

let chatChannel: StreamChannel | null = null;
let botUserId: string | null = null;
let lastPostedReply: { normalized: string; at: number } | null = null;

const REPLY_DEDUP_WINDOW_MS = 15_000;

function normalizeReplyText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function registerTalkChatBridge(input: {
  channel: StreamChannel | null;
  botUserId: string;
}): void {
  chatChannel = input.channel;
  botUserId = input.botUserId;
}

export function resetTalkChatReplyDedup(): void {
  lastPostedReply = null;
}

export async function postTalkEmployeeChatReply(text: string): Promise<void> {
  if (!chatChannel || !botUserId || !text.trim()) {
    return;
  }

  const trimmed = text.trim();
  const normalized = normalizeReplyText(trimmed);
  const now = Date.now();

  if (
    lastPostedReply &&
    lastPostedReply.normalized === normalized &&
    now - lastPostedReply.at < REPLY_DEDUP_WINDOW_MS
  ) {
    return;
  }

  await chatChannel.sendMessage({
    text: trimmed,
    user_id: botUserId,
  });

  lastPostedReply = { normalized, at: now };
}
