"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
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
  threadId?: string | null,
): Promise<ConnectTalkChatSessionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
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
      { threadId: threadId ?? null },
    );

    if (!chatSession) {
      return { ok: false, message: "Failed to create talk chat session" };
    }

    return { ok: true, chatSession };
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      return {
        ok: false,
        message: "Database is temporarily unreachable. Please try again.",
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
