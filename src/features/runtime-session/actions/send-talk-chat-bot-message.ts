"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
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

    const expectedPrefixMain = "etu-";
    const expectedPrefixThread = `et-${employeeId}-`;
    const id = channelId.trim();
    if (
      !id ||
      !(id.startsWith(expectedPrefixMain) || id.startsWith(expectedPrefixThread))
    ) {
      return { ok: false, message: "Invalid Talk channel" };
    }

    const messageId = await sendTalkChatBotMessage({
      employeeId,
      channelId: id,
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
