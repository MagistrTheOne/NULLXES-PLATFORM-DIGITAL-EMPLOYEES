"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  createTalkChatSession,
  type TalkChatCredentials,
} from "../services/create-talk-chat-session";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";

export type ConnectTalkChatSessionResult =
  | { ok: true; chatSession: TalkChatCredentials }
  | { ok: false; message: string };

export async function connectTalkChatSessionAction(
  employeeId: string,
): Promise<ConnectTalkChatSessionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const talkContext = await getEmployeeTalkContext(
      workspace.organization.id,
      employeeId,
    );

    if (!talkContext?.canTalk) {
      return { ok: false, message: "Talk is not available for this employee" };
    }

    const chatSession = await createTalkChatSession(
      workspace.organization.id,
      employeeId,
      workspace.user.id,
      workspace.user.name,
      talkContext,
    );

    if (!chatSession) {
      return { ok: false, message: "Failed to create talk chat session" };
    }

    return { ok: true, chatSession };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
