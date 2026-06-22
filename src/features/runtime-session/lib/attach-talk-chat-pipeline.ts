import type { AnamClient } from "@anam-ai/js-sdk";
import type { Channel as StreamChannel, Event } from "stream-chat";
import { appendSessionMessageAction } from "../actions/employee-session";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  getTalkPipelineCoordinator,
} from "./talk-pipeline-coordinator";
import { postTalkEmployeeChatReply } from "./talk-reply-bridge";
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
  }).catch((error: unknown) => {
    console.error("Failed to persist user talk message", error);
  });
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

    const turnKey = buildTalkTurnKey(message.text.trim());
    if (!coordinator.tryBeginTalkTurn(turnKey)) {
      return;
    }

    lastHandledMessageId = message.id;
    processing = true;

    void (async () => {
      try {
        if (input.employeeSessionId) {
          persistUserSessionMessage({
            sessionId: input.employeeSessionId,
            content: message.text!.trim(),
            streamMessageId: message.id,
          });
        }

        const pipelineMessages = buildPipelineMessages(input.channel, botUserId);
        const replyText = await streamTalkBrainReply({
          employeeId: input.employeeId,
          sessionId: input.employeeSessionId,
          messages: pipelineMessages,
        });

        if (input.employeeSessionId) {
          await appendSessionMessageAction({
            sessionId: input.employeeSessionId,
            role: "assistant",
            content: replyText,
          });
        }

        await postTalkEmployeeChatReply(replyText);

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
        await postTalkEmployeeChatReply(fallback);
        coordinator.completeTalkTurn(turnKey, fallback);
      } finally {
        processing = false;
      }
    })();
  };

  input.channel.on("message.new", handleNewMessage);

  return () => {
    input.channel.off("message.new", handleNewMessage);
  };
}
