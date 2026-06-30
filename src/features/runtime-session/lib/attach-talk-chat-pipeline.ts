import type { AnamClient } from "@anam-ai/js-sdk";
import type { Channel as StreamChannel, Event } from "stream-chat";
import { dispatchHqTaskFromChatAction } from "@/features/hq/actions/dispatch-hq-task-from-chat";
import { appendSessionMessageAction } from "../actions/employee-session";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  getTalkPipelineCoordinator,
} from "./talk-pipeline-coordinator";
import { postTalkEmployeeChatReply } from "./talk-reply-bridge";
import { registerTalkRegenerateHandler } from "./talk-regenerate-bridge";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";

function digitalEmployeeChatUserId(employeeId: string): string {
  return `digital-employee-${employeeId}`;
}

function buildPipelineMessages(
  channel: StreamChannel,
  botUserId: string,
): Array<{ role: "user" | "persona"; content: string }> {
  return (channel.state.messages ?? [])
    .filter((message) => message.type === "regular" && message.text?.trim())
    .map((message) => ({
      role:
        message.user?.id === botUserId
          ? ("persona" as const)
          : ("user" as const),
      content: message.text!.trim(),
    }));
}

function persistUserSessionMessage(input: {
  sessionId: string;
  content: string;
  streamMessageId?: string;
}): void {
  void appendSessionMessageAction({
    sessionId: input.sessionId,
    role: "user",
    content: input.content,
    streamMessageId: input.streamMessageId,
  }).catch(() => undefined);
}

export function attachTalkChatPipeline(input: {
  channel: StreamChannel;
  employeeId: string;
  employeeSessionId?: string;
  actorUserId: string;
  isSessionLive: boolean;
  voiceMode: TalkVoiceMode;
  getAnamClient: () => AnamClient | null;
}): () => void {
  const coordinator = getTalkPipelineCoordinator(input.employeeId);
  const botUserId = digitalEmployeeChatUserId(input.employeeId);
  let processing = false;
  let lastHandledMessageId: string | null = null;

  const runBrainTurn = async (userText: string, userStreamMessageId?: string) => {
    const turnKey = buildTalkTurnKey(userText.trim());
    if (!coordinator.tryBeginTalkTurn(turnKey)) {
      return;
    }

    try {
      if (input.employeeSessionId) {
        persistUserSessionMessage({
          sessionId: input.employeeSessionId,
          content: userText.trim(),
          streamMessageId: userStreamMessageId,
        });
      }

      void dispatchHqTaskFromChatAction(input.employeeId, userText.trim()).catch(
        () => undefined,
      );

      const pipelineMessages = buildPipelineMessages(input.channel, botUserId);
      const replyText = await streamTalkBrainReply({
        employeeId: input.employeeId,
        sessionId: input.employeeSessionId,
        messages: pipelineMessages,
      });

      const streamMessageId = await postTalkEmployeeChatReply(replyText);

      if (input.employeeSessionId) {
        await appendSessionMessageAction({
          sessionId: input.employeeSessionId,
          role: "assistant",
          content: replyText,
          streamMessageId: streamMessageId ?? undefined,
        });
      }

      const anamClient = input.getAnamClient();
      if (input.isSessionLive && anamClient) {
        await playTalkVoiceReply({
          anamClient,
          employeeId: input.employeeId,
          replyText,
          voiceMode: input.voiceMode,
        });
      }

      coordinator.completeTalkTurn(turnKey, replyText);
    } catch {
      coordinator.failTalkTurn();
      const fallback =
        "I could not process that message right now. Please try again.";
      const streamMessageId = await postTalkEmployeeChatReply(fallback);
      if (input.employeeSessionId) {
        await appendSessionMessageAction({
          sessionId: input.employeeSessionId,
          role: "assistant",
          content: fallback,
          streamMessageId: streamMessageId ?? undefined,
        }).catch(() => undefined);
      }
      coordinator.completeTalkTurn(turnKey, fallback);
    }
  };

  const handleNewMessage = (event: Event) => {
    const message = event.message;
    if (!message?.id || !message.text?.trim()) {
      return;
    }

    if (message.user?.id !== input.actorUserId) {
      return;
    }

    if (message.id === lastHandledMessageId || processing) {
      return;
    }

    lastHandledMessageId = message.id;
    processing = true;

    void (async () => {
      try {
        await runBrainTurn(message.text!.trim(), message.id);
      } finally {
        processing = false;
      }
    })();
  };

  const handleRegenerate = async (botMessageId: string) => {
    if (processing) {
      return;
    }

    const messages = input.channel.state.messages ?? [];
    const botIndex = messages.findIndex((item) => item.id === botMessageId);
    if (botIndex <= 0) {
      return;
    }

    let userMessage = null;
    for (let index = botIndex - 1; index >= 0; index -= 1) {
      const candidate = messages[index];
      if (
        candidate.user?.id === input.actorUserId &&
        candidate.text?.trim()
      ) {
        userMessage = candidate;
        break;
      }
    }

    if (!userMessage?.text?.trim()) {
      return;
    }

    processing = true;
    try {
      await input.channel.getClient().deleteMessage(botMessageId, true);
      await runBrainTurn(userMessage.text.trim(), userMessage.id);
    } finally {
      processing = false;
    }
  };

  registerTalkRegenerateHandler(handleRegenerate);

  input.channel.on("message.new", handleNewMessage);

  return () => {
    input.channel.off("message.new", handleNewMessage);
    registerTalkRegenerateHandler(null);
  };
}
