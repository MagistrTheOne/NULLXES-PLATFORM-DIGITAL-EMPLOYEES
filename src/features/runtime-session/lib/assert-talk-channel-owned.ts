import { StreamChat } from "stream-chat";
import { getStreamApiKey, getStreamSecretKey } from "@/shared/config/env";
import { talkChannelId } from "./talk-channel-id";

/**
 * Prove the caller owns the Talk Stream channel before bot inject / join.
 */
export async function assertTalkChannelOwnedByActor(input: {
  employeeId: string;
  channelId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const id = input.channelId.trim();
  if (!id) {
    return { ok: false, message: "Invalid Talk channel" };
  }

  const mainId = talkChannelId(input.employeeId, null, input.actorUserId);
  if (id === mainId) {
    return { ok: true };
  }

  const threadPrefix = `et-${input.employeeId}-`;
  if (!id.startsWith(threadPrefix)) {
    return { ok: false, message: "Invalid Talk channel" };
  }

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  if (!apiKey || !secret) {
    return { ok: false, message: "Talk chat is not configured" };
  }

  try {
    const server = StreamChat.getInstance(apiKey, secret);
    const channel = server.channel("messaging", id);
    const state = await channel.query({ state: true, watch: false });
    const data = (state.channel ?? channel.data ?? {}) as {
      talkEmployeeId?: string;
      talkUserId?: string;
      talkKind?: string;
    };
    const isMember = Boolean(state.members?.[input.actorUserId]);
    const owned =
      data.talkEmployeeId === input.employeeId &&
      data.talkKind === "thread" &&
      (data.talkUserId === input.actorUserId || isMember);

    if (!owned) {
      return { ok: false, message: "Invalid Talk channel" };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Invalid Talk channel" };
  }
}
