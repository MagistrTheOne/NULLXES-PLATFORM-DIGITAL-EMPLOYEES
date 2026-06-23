import { StreamChat } from "stream-chat";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";
import {
  getPublicStreamApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
import type { EmployeeTalkContext } from "../types/employee-talk-context";
import { getEmployeeTalkContext } from "./get-employee-talk-context";

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

function isStreamChatProvisioned(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return typeof metadata?.streamChatProvisionedAt === "string";
}

export async function createTalkChatSession(
  organizationId: string,
  employeeId: string,
  actorUserId: string,
  actorName: string,
  talkContext?: EmployeeTalkContext | null,
): Promise<TalkChatCredentials | null> {
  const employee =
    talkContext ??
    (await getEmployeeTalkContext(organizationId, employeeId));

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
  const channelProvisioned = isStreamChatProvisioned(
    employee.sessionProviderMetadata,
  );

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

  if (!channelProvisioned) {
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

    const existingSessionMetadata =
      employee.sessionProviderMetadata &&
      typeof employee.sessionProviderMetadata === "object"
        ? employee.sessionProviderMetadata
        : {};

    await mergeProviderConfig(employeeId, "session", {
      providerMetadata: {
        ...existingSessionMetadata,
        streamChatProvisionedAt: new Date().toISOString(),
      },
    } satisfies Partial<SessionProviderConfigPayload>);
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
