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

/** Stream channel id for a talk thread. The default (null) keeps the legacy id. */
export function talkChannelId(
  employeeId: string,
  threadId?: string | null,
): string {
  return threadId
    ? `et-${employeeId}-${threadId}`
    : `employee-talk-${employeeId}`;
}

function isStreamChatProvisioned(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return typeof metadata?.streamChatProvisionedAt === "string";
}

export type CreateTalkChatSessionOptions = {
  threadId?: string | null;
  title?: string;
};

export async function createTalkChatSession(
  organizationId: string,
  employeeId: string,
  actorUserId: string,
  actorName: string,
  talkContext?: EmployeeTalkContext | null,
  options?: CreateTalkChatSessionOptions,
): Promise<TalkChatCredentials | null> {
  const employee =
    talkContext ??
    (await getEmployeeTalkContext(organizationId, employeeId));

  if (!employee?.canTalk) {
    return null;
  }

  const threadId = options?.threadId ?? null;

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  const publicApiKey = getPublicStreamApiKey();

  if (!apiKey || !secret || !publicApiKey) {
    throw new Error(
      "STREAM_API_KEY, STREAM_SECRET_KEY, and NEXT_PUBLIC_STREAM_API_KEY must be configured for Talk chat.",
    );
  }

  const server = StreamChat.getInstance(apiKey, secret);
  const botUserId = digitalEmployeeChatUserId(employeeId);
  const channelId = talkChannelId(employeeId, threadId);
  // Only the legacy default channel uses the provisioned shortcut; named
  // threads always ensure their own channel (with queryable thread metadata).
  const channelProvisioned =
    threadId === null && isStreamChatProvisioned(employee.sessionProviderMetadata);

  await server.upsertUsers([
    { id: actorUserId, name: actorName },
    {
      id: botUserId,
      name: employee.name,
      image: employee.avatarPreviewUrl ?? undefined,
    },
  ]);

  const channelData: Record<string, unknown> = {
    members: [actorUserId, botUserId],
  };
  if (threadId) {
    channelData.talkKind = "thread";
    channelData.talkEmployeeId = employeeId;
    channelData.talkTitle = options?.title ?? "New chat";
  }

  const channel = server.channel("messaging", channelId, channelData);

  if (!channelProvisioned) {
    try {
      await channel.create({
        created_by_id: actorUserId,
      });
    } catch {
      // Channel already exists for repeat Talk sessions on the same thread.
    }

    try {
      await channel.addMembers([actorUserId, botUserId]);
    } catch {
      // Members may already be on the channel.
    }

    if (threadId === null) {
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
