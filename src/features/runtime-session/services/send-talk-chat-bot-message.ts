import { StreamChat } from "stream-chat";
import { getStreamApiKey, getStreamSecretKey } from "@/shared/config/env";

function digitalEmployeeChatUserId(employeeId: string): string {
  return `digital-employee-${employeeId}`;
}

function talkChannelId(employeeId: string): string {
  return `employee-talk-${employeeId}`;
}

export async function sendTalkChatBotMessage(
  employeeId: string,
  text: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message text is required");
  }

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  if (!apiKey || !secret) {
    throw new Error("Stream credentials are not configured");
  }

  const server = StreamChat.getInstance(apiKey, secret);
  const channel = server.channel("messaging", talkChannelId(employeeId));

  const response = await channel.sendMessage({
    text: trimmed,
    user_id: digitalEmployeeChatUserId(employeeId),
    ...({
      custom: { nullxes_talk_role: "assistant" },
    } as Record<string, unknown>),
  });

  return response.message.id;
}
