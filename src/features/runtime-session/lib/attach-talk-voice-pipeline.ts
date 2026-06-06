import type { AnamClient } from "@anam-ai/js-sdk";
import { AnamEvent, MessageRole } from "@anam-ai/js-sdk";
import type { Message } from "@anam-ai/js-sdk";
import type { TalkPipelineState } from "../context/talk-anam-context";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { appendSessionMessageAction } from "../actions/employee-session";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  getTalkPipelineCoordinator,
  type TalkPipelineCoordinator,
} from "./talk-pipeline-coordinator";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { postTalkEmployeeChatReply } from "./talk-reply-bridge";

const USER_MESSAGE_DEBOUNCE_MS = 750;
const MIN_USER_MESSAGE_LENGTH = 3;

function isSubstantiveUserMessage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_USER_MESSAGE_LENGTH) {
    return false;
  }

  return /[\p{L}\p{N}]/u.test(trimmed);
}

export function attachTalkVoicePipeline(input: {
  anamClient: AnamClient;
  employeeId: string;
  employeeSessionId?: string;
  voiceMode: TalkVoiceMode;
  setPipelineState: (state: TalkPipelineState) => void;
}): () => void {
  const coordinator = getTalkPipelineCoordinator(input.employeeId);
  coordinator.reset();

  let processing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingHistory: Message[] | null = null;
  let pendingMessage: Message | null = null;

  const processUserMessage = (
    messageHistory: Message[],
    userMessage: Message,
    pipelineCoordinator: TalkPipelineCoordinator,
  ) => {
    if (processing) {
      return;
    }

    const content = userMessage.content?.trim() ?? "";
    if (!isSubstantiveUserMessage(content)) {
      return;
    }

    if (pipelineCoordinator.isLikelyAssistantEcho(content)) {
      return;
    }

    const turnKey = buildTalkTurnKey(content);
    if (!pipelineCoordinator.tryBeginTalkTurn(turnKey)) {
      return;
    }

    processing = true;
    input.setPipelineState("thinking");

    void (async () => {
      try {
        const pipelineMessages = messageHistory.map((message) => ({
          role: message.role === MessageRole.USER ? "user" : "persona",
          content: message.content,
        })) as Array<{ role: "user" | "persona"; content: string }>;

        if (input.employeeSessionId) {
          const lastUser = pipelineMessages.at(-1);
          if (lastUser?.role === "user") {
            await appendSessionMessageAction({
              sessionId: input.employeeSessionId,
              role: "user",
              content: lastUser.content,
            });
          }
        }

        let replyText: string;

        if (input.voiceMode === "elevenlabs") {
          replyText = await streamTalkBrainReply({
            employeeId: input.employeeId,
            sessionId: input.employeeSessionId,
            messages: pipelineMessages,
          });

          input.setPipelineState("speaking");
          await playTalkVoiceReply({
            anamClient: input.anamClient,
            employeeId: input.employeeId,
            replyText,
            voiceMode: input.voiceMode,
          });
        } else {
          const talkStream = input.anamClient.createTalkMessageStream();

          replyText = await streamTalkBrainReply({
            employeeId: input.employeeId,
            sessionId: input.employeeSessionId,
            messages: pipelineMessages,
            onChunk: async (chunk) => {
              if (chunk.trim()) {
                input.setPipelineState("speaking");
              }
              if (talkStream.isActive()) {
                await talkStream.streamMessageChunk(chunk, false);
              }
            },
          });

          if (talkStream.isActive()) {
            await talkStream.endMessage();
          }
        }

        await postTalkEmployeeChatReply(replyText);
        if (input.employeeSessionId) {
          await appendSessionMessageAction({
            sessionId: input.employeeSessionId,
            role: "assistant",
            content: replyText,
          });
        }
        pipelineCoordinator.completeTalkTurn(turnKey, replyText);
        input.setPipelineState("idle");
      } catch {
        pipelineCoordinator.failTalkTurn();
        const fallback =
          "Something went wrong while generating a response. Please try again.";
        input.setPipelineState("speaking");
        await playTalkVoiceReply({
          anamClient: input.anamClient,
          employeeId: input.employeeId,
          replyText: fallback,
          voiceMode: input.voiceMode,
        });
        await postTalkEmployeeChatReply(fallback);
        pipelineCoordinator.completeTalkTurn(turnKey, fallback);
        input.setPipelineState("idle");
      } finally {
        processing = false;
      }
    })();
  };

  const handleMessageHistory = (messageHistory: Message[]) => {
    if (processing || messageHistory.length === 0) {
      return;
    }

    const lastMessage = messageHistory[messageHistory.length - 1];
    if (lastMessage.role !== MessageRole.USER) {
      return;
    }

    pendingHistory = messageHistory;
    pendingMessage = lastMessage;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!pendingHistory || !pendingMessage) {
        return;
      }

      processUserMessage(pendingHistory, pendingMessage, coordinator);
      pendingHistory = null;
      pendingMessage = null;
    }, USER_MESSAGE_DEBOUNCE_MS);
  };

  const onInterrupted = () => {
    processing = false;
    coordinator.failTalkTurn();
    input.setPipelineState("idle");
  };

  input.anamClient.addListener(
    AnamEvent.MESSAGE_HISTORY_UPDATED,
    handleMessageHistory,
  );
  input.anamClient.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, onInterrupted);

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    input.anamClient.removeListener(
      AnamEvent.MESSAGE_HISTORY_UPDATED,
      handleMessageHistory,
    );
    input.anamClient.removeListener(
      AnamEvent.TALK_STREAM_INTERRUPTED,
      onInterrupted,
    );
  };
}
