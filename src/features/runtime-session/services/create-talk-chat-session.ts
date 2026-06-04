import { StreamChat } from "stream-chat";
import {
  getPublicStreamApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";

export type TalkChatCredentials = {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  channelType: string;
  channelId: string;
};

function digitalEmployeeChatUserId(employeeId: string): string {
  return `digital-employee-${employeeId}`;
}

export async function createTalkChatSession(
  organizationId: string,
  employeeId: string,
  actorUserId: string,
  actorName: string,
): Promise<TalkChatCredentials | null> {
  const employee = await getEmployeeDetail(organizationId, employeeId);

  if (!employee?.canTalk) {
    return null;
  }

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  const publicApiKey = getPublicStreamApiKey();

  if (!apiKey || !secret || !publicApiKey) {
    throw new Error(
      "STREAM_API_KEY and STREAM_SECRET_KEY must be configured for Talk chat.",
    );
  }

  const server = StreamChat.getInstance(apiKey, secret);
  const botUserId = digitalEmployeeChatUserId(employeeId);
  const channelId = `employee-talk-${employeeId}`;

  await server.upsertUsers([
    { id: actorUserId, name: actorName },
    {
      id: botUserId,
      name: employee.name,
      image: employee.avatarPreviewUrl ?? undefined,
    },
  ]);

  const channel = server.channel("messaging", channelId, {
    members: [actorUserId, botUserId],
  });

  try {
    await channel.create({
      created_by_id: actorUserId,
    });
  } catch {
    // Channel already exists for repeat Talk sessions on the same employee.
  }

  try {
    await channel.addMembers([actorUserId, botUserId]);
  } catch {
    // Members may already be on the channel.
  }

  const token = server.createToken(actorUserId);

  return {
    apiKey: publicApiKey,
    token,
    userId: actorUserId,
    userName: actorName,
    channelType: "messaging",
    channelId,
  };
}
