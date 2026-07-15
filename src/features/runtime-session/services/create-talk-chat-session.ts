import { StreamChat } from "stream-chat";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { assertForeignDataProcessingAllowed } from "@/features/privacy/services/assert-foreign-data-processing";
import { mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";
import {
  getPublicStreamApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
import {
  digitalEmployeeChatUserId,
  talkChannelId,
} from "../lib/talk-channel-id";
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

  await assertForeignDataProcessingAllowed(organizationId, "stream");

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
  const channelId = talkChannelId(employeeId, threadId, actorUserId);

  await server.upsertUsers([
    { id: actorUserId, name: actorName },
    {
      id: botUserId,
      name: employee.name,
      image: employee.avatarPreviewUrl ?? undefined,
    },
  ]);

  // Private channel: only this user + the digital employee bot.
  const channelData: Record<string, unknown> = {
    members: [actorUserId, botUserId],
    talkEmployeeId: employeeId,
    talkOrganizationId: organizationId,
    talkUserId: actorUserId,
  };
  if (threadId) {
    channelData.talkKind = "thread";
    channelData.talkTitle = options?.title ?? "New chat";
  } else {
    channelData.talkKind = "main";
  }

  const channel = server.channel("messaging", channelId, channelData);

  try {
    await channel.create({
      created_by_id: actorUserId,
    });
  } catch {
    // Channel already exists for repeat Talk sessions on the same thread/user.
  }

  try {
    // Ensure membership without adding other humans (security isolation).
    await channel.addMembers([actorUserId, botUserId]);
  } catch {
    // Members may already be on the channel.
  }

  // Best-effort: drop any other human members left on a recycled channel.
  try {
    const state = await channel.query({ state: true, watch: false });
    const extraMembers = Object.keys(state.members ?? {}).filter(
      (memberId) => memberId !== actorUserId && memberId !== botUserId,
    );
    if (extraMembers.length > 0) {
      await channel.removeMembers(extraMembers);
    }
  } catch {
    // Non-fatal — channel is still usable for this user.
  }

  if (threadId === null) {
    const existingSessionMetadata =
      employee.sessionProviderMetadata &&
      typeof employee.sessionProviderMetadata === "object"
        ? employee.sessionProviderMetadata
        : {};

    await mergeProviderConfig(
      employeeId,
      "session",
      {
        providerMetadata: {
          ...existingSessionMetadata,
          streamChatProvisionedAt: new Date().toISOString(),
        },
      } satisfies Partial<SessionProviderConfigPayload>,
      { allowCatalogMutation: true, organizationId },
    );
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

export { talkChannelId } from "../lib/talk-channel-id";
