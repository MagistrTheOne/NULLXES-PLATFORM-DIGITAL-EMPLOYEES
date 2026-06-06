import type { AnamClient } from "@anam-ai/js-sdk";
import { AnamEvent, MessageRole } from "@anam-ai/js-sdk";
import type { Message } from "@anam-ai/js-sdk";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  getTalkPipelineCoordinator,
  type TalkPipelineCoordinator,
} from "./talk-pipeline-coordinator";
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
  voiceMode: TalkVoiceMode;
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

    void (async () => {
      try {
        const pipelineMessages = messageHistory.map((message) => ({
          role: message.role === MessageRole.USER ? "user" : "persona",
          content: message.content,
        })) as Array<{ role: "user" | "persona"; content: string }>;

        const talkStream =
          input.voiceMode === "anam"
            ? input.anamClient.createTalkMessageStream()
            : null;

        const replyText = await streamTalkBrainReply({
          employeeId: input.employeeId,
          messages: pipelineMessages,
          onChunk: async (chunk) => {
            if (talkStream?.isActive()) {
              await talkStream.streamMessageChunk(chunk, false);
            }
          },
        });

        if (talkStream?.isActive()) {
          await talkStream.endMessage();
        } else if (input.voiceMode === "elevenlabs") {
          await playTalkVoiceReply({
            anamClient: input.anamClient,
            employeeId: input.employeeId,
            replyText,
            voiceMode: input.voiceMode,
          });
        }

        await postTalkEmployeeChatReply(replyText);
        pipelineCoordinator.completeTalkTurn(turnKey, replyText);
      } catch {
        pipelineCoordinator.failTalkTurn();
        const fallback =
          "Something went wrong while generating a response. Please try again.";
        await input.anamClient.talk(fallback);
        await postTalkEmployeeChatReply(fallback);
        pipelineCoordinator.completeTalkTurn(turnKey, fallback);
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
