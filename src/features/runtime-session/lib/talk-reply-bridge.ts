import type { Channel as StreamChannel } from "stream-chat";

let chatChannel: StreamChannel | null = null;
let botUserId: string | null = null;

export function registerTalkChatBridge(input: {
  channel: StreamChannel | null;
  botUserId: string;
}): void {
  chatChannel = input.channel;
  botUserId = input.botUserId;
}

export async function postTalkEmployeeChatReply(text: string): Promise<void> {
  if (!chatChannel || !botUserId || !text.trim()) {
    return;
  }

  await chatChannel.sendMessage({
    text: text.trim(),
    user_id: botUserId,
  });
}
