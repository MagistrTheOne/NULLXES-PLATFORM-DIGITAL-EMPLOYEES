"use server";

import { StreamChat, type ChannelFilters } from "stream-chat";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { getStreamApiKey, getStreamSecretKey } from "@/shared/config/env";

export type TalkThreadSummary = {
  /** null = the default "Main" channel; otherwise the thread suffix. */
  threadId: string | null;
  title: string;
  lastMessageAt: string | null;
};

/**
 * List the user's named talk threads for an employee (newest first). The
 * default channel is not included here — the UI always shows it as "Main".
 * Returns [] on any failure so the sidebar degrades to just the Main thread.
 */
export async function listTalkThreadsAction(
  employeeId: string,
): Promise<TalkThreadSummary[]> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );

    const apiKey = getStreamApiKey();
    const secret = getStreamSecretKey();
    if (!apiKey || !secret) {
      return [];
    }

    const server = StreamChat.getInstance(apiKey, secret);
    const prefix = `et-${employeeId}-`;

    const filter = {
      talkKind: "thread",
      talkEmployeeId: employeeId,
      members: { $in: [workspace.user.id] },
    } as unknown as ChannelFilters;

    const channels = await server.queryChannels(
      filter,
      { last_message_at: -1 },
      { limit: 30, watch: false, state: false },
    );

    return channels
      .map((channel) => {
        const id = channel.id ?? "";
        const data = (channel.data ?? {}) as {
          talkTitle?: string;
          last_message_at?: string;
        };
        return {
          threadId: id.startsWith(prefix) ? id.slice(prefix.length) : id,
          title: data.talkTitle ?? "Chat",
          lastMessageAt: data.last_message_at ?? null,
        };
      })
      .filter((thread) => thread.threadId.length > 0);
  } catch {
    return [];
  }
}
