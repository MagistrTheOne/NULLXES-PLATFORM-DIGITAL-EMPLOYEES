"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";
import { sendTalkChatBotMessage } from "../services/send-talk-chat-bot-message";

export async function sendTalkChatBotMessageAction(
  employeeId: string,
  text: string,
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

    const messageId = await sendTalkChatBotMessage(employeeId, text);
    return { ok: true, messageId };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to send reply",
    };
  }
}
