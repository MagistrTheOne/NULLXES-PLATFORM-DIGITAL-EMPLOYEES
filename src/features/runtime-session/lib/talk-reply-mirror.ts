import { appendSessionMessageAction } from "../actions/employee-session";
import { postTalkEmployeeChatReply } from "./talk-reply-bridge";

/** Fire-and-forget: mirror assistant reply to GetStream + Postgres session log. */
export function mirrorTalkReplyToChat(input: {
  text: string;
  sessionId?: string;
}): void {
  void postTalkEmployeeChatReply(input.text).then((streamMessageId) => {
    if (!input.sessionId) {
      return;
    }

    void appendSessionMessageAction({
      sessionId: input.sessionId,
      role: "assistant",
      content: input.text,
      streamMessageId: streamMessageId ?? undefined,
    }).catch(() => undefined);
  });
}
