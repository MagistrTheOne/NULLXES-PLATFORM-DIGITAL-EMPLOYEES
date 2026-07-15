"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { assertTalkChannelOwnedByActor } from "../lib/assert-talk-channel-owned";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";
import { sendTalkChatBotMessage } from "../services/send-talk-chat-bot-message";

export async function sendTalkChatBotMessageAction(
  employeeId: string,
  text: string,
  channelId: string,
): Promise<{ ok: true; messageId: string } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const employee = await getEmployeeTalkContext(
      workspace.organization.id,
      employeeId,
    );

    if (!employee?.canTalk) {
      return { ok: false, message: "Talk is not available for this employee" };
    }

    const ownership = await assertTalkChannelOwnedByActor({
      employeeId,
      channelId,
      actorUserId: workspace.user.id,
    });
    if (!ownership.ok) {
      return ownership;
    }

    const messageId = await sendTalkChatBotMessage({
      employeeId,
      channelId: channelId.trim(),
      text,
    });
    return { ok: true, messageId };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to send reply",
    };
  }
}
