import type { AnamClient } from "@anam-ai/js-sdk";
import type { Channel as StreamChannel, Event } from "stream-chat";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  completeTalkTurn,
  failTalkTurn,
  tryBeginTalkTurn,
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

export function attachTalkChatPipeline(input: {
  channel: StreamChannel;
  employeeId: string;
  actorUserId: string;
  isSessionLive: boolean;
  voiceMode: TalkVoiceMode;
  getAnamClient: () => AnamClient | null;
}): () => void {
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
    if (!tryBeginTalkTurn(turnKey)) {
      return;
    }

    lastHandledMessageId = message.id;
    processing = true;

    void (async () => {
      try {
        const pipelineMessages = buildPipelineMessages(input.channel, botUserId);
        const replyText = await streamTalkBrainReply({
          employeeId: input.employeeId,
          messages: pipelineMessages,
        });

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

        completeTalkTurn(turnKey, replyText);
      } catch {
        failTalkTurn();
        const fallback =
          "I could not process that message right now. Please try again.";
        await postTalkEmployeeChatReply(fallback);
        completeTalkTurn(turnKey, fallback);
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
