import { StreamChat, type ChannelFilters } from "stream-chat";
import { getStreamApiKey, getStreamSecretKey } from "@/shared/config/env";
import { legacySharedTalkChannelId } from "@/features/runtime-session/lib/talk-channel-id";

export type StreamChannelPurgeResult = {
  purgedChannels: number;
};

function parseStreamTimestamp(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Delete Stream Chat channels whose last activity is older than the retention cutoff.
 * Covers named threads, per-user main channels, and legacy shared employee-talk channels.
 */
export async function purgeStreamChannelsForRetention(input: {
  employeeIds: string[];
  cutoff: Date;
}): Promise<StreamChannelPurgeResult> {
  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();

  if (!apiKey || !secret || input.employeeIds.length === 0) {
    return { purgedChannels: 0 };
  }

  const server = StreamChat.getInstance(apiKey, secret);
  let purgedChannels = 0;

  for (const employeeId of input.employeeIds) {
    const employeeFilter = {
      talkEmployeeId: employeeId,
    } as unknown as ChannelFilters;

    const employeeChannels = await server.queryChannels(
      employeeFilter,
      { last_message_at: 1 },
      { limit: 100, watch: false, state: false },
    );

    for (const channel of employeeChannels) {
      const lastDate = parseStreamTimestamp(channel.data?.last_message_at);

      if (lastDate && lastDate < input.cutoff && channel.cid) {
        await server.deleteChannels([channel.cid], { hard_delete: true });
        purgedChannels += 1;
      }
    }

    const legacyChannelId = legacySharedTalkChannelId(employeeId);
    const legacy = server.channel("messaging", legacyChannelId);

    try {
      await legacy.query({});
      const lastDate = parseStreamTimestamp(legacy.data?.last_message_at);

      if (lastDate && lastDate < input.cutoff) {
        await server.deleteChannels([`messaging:${legacyChannelId}`], {
          hard_delete: true,
        });
        purgedChannels += 1;
      }
    } catch {
      // Legacy channel may not exist for this employee.
    }
  }

  return { purgedChannels };
}
