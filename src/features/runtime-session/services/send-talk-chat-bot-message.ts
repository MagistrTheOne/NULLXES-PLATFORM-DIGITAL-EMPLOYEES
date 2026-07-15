import { StreamChat } from "stream-chat";
import { getStreamApiKey, getStreamSecretKey } from "@/shared/config/env";
import { digitalEmployeeChatUserId } from "../lib/talk-channel-id";

export async function sendTalkChatBotMessage(input: {
  employeeId: string;
  channelId: string;
  text: string;
}): Promise<string> {
  const trimmed = input.text.trim();
  if (!trimmed) {
    throw new Error("Message text is required");
  }

  if (!input.channelId.trim()) {
    throw new Error("Talk channel id is required");
  }

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  if (!apiKey || !secret) {
    throw new Error("Stream credentials are not configured");
  }

  const server = StreamChat.getInstance(apiKey, secret);
  const channel = server.channel("messaging", input.channelId.trim());

  const response = await channel.sendMessage({
    text: trimmed,
    user_id: digitalEmployeeChatUserId(input.employeeId),
    ...({
      custom: { nullxes_talk_role: "assistant" },
    } as Record<string, unknown>),
  });

  return response.message.id;
}
