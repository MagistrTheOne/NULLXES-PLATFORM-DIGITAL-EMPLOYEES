import type { AnamClient } from "@anam-ai/js-sdk";
import { AnamEvent, MessageRole } from "@anam-ai/js-sdk";
import type { Message } from "@anam-ai/js-sdk";
import type { TalkPipelineState } from "../context/talk-anam-context";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { appendSessionMessageAction } from "../actions/employee-session";
import { prefetchTalkQueryEmbeddingAction } from "../actions/prefetch-talk-query-embedding";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import {
  buildTalkTurnKey,
  getTalkPipelineCoordinator,
  type TalkPipelineCoordinator,
} from "./talk-pipeline-coordinator";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { mirrorTalkReplyToChat } from "./talk-reply-mirror";
import {
  createTalkTurnTelemetry,
  type TalkTurnTelemetryInput,
} from "./talk-turn-telemetry";

const USER_MESSAGE_DEBOUNCE_MS = 100;
const USER_MESSAGE_DEBOUNCE_SHORT_MS = 50;
const SHORT_USER_MESSAGE_MAX_LENGTH = 20;
const MIN_USER_MESSAGE_LENGTH = 2;

function resolveUserMessageDebounceMs(content: string): number {
  const trimmed = content.trim();
  if (
    trimmed.length > 0 &&
    trimmed.length < SHORT_USER_MESSAGE_MAX_LENGTH
  ) {
    return USER_MESSAGE_DEBOUNCE_SHORT_MS;
  }

  return USER_MESSAGE_DEBOUNCE_MS;
}

function persistUserSessionMessage(input: {
  sessionId: string;
  content: string;
}): void {
  void appendSessionMessageAction({
    sessionId: input.sessionId,
    role: "user",
    content: input.content,
  }).catch(() => undefined);
}

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
  scenarioSessionId?: string;
  voiceMode: TalkVoiceMode;
  setPipelineState: (state: TalkPipelineState) => void;
}): () => void {
  const coordinator = getTalkPipelineCoordinator(input.employeeId);
  coordinator.reset();

  let processing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingHistory: Message[] | null = null;
  let pendingMessage: Message | null = null;
  let pendingTelemetry: ReturnType<typeof createTalkTurnTelemetry> | null =
    null;
  let activeBrainAbort: AbortController | null = null;

  const telemetryInput = (): TalkTurnTelemetryInput => ({
    employeeId: input.employeeId,
    sessionId: input.employeeSessionId,
    voiceMode: input.voiceMode,
    scenarioSessionId: input.scenarioSessionId,
  });

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

    const telemetry =
      pendingTelemetry ?? createTalkTurnTelemetry(telemetryInput());
    pendingTelemetry = null;
    telemetry.markBrainRequestStart();
    const turnId = telemetry.turnId;
    const brainAbort = new AbortController();
    activeBrainAbort = brainAbort;

    void (async () => {
      try {
        const pipelineMessages = messageHistory.map((message) => ({
          role: message.role === MessageRole.USER ? "user" : "persona",
          content: message.content,
        })) as Array<{ role: "user" | "persona"; content: string }>;

        if (input.employeeSessionId) {
          const lastUser = pipelineMessages.at(-1);
          if (lastUser?.role === "user") {
            persistUserSessionMessage({
              sessionId: input.employeeSessionId,
              content: lastUser.content,
            });
          }
        }

        let replyText: string;

        if (input.voiceMode === "elevenlabs") {
          replyText = await streamTalkBrainReply({
            employeeId: input.employeeId,
            sessionId: input.employeeSessionId,
            turnId,
            scenarioSessionId: input.scenarioSessionId,
            messages: pipelineMessages,
            signal: brainAbort.signal,
            onServerPerf: (payload) => {
              telemetry.mergeServerPerf(payload);
              if (payload.spans?.tool_loop) {
                telemetry.mergeServerPerf({
                  flags: { toolsUsed: true },
                });
              }
            },
          });

          telemetry.markFirstBrainChunk();
          input.setPipelineState("speaking");
          telemetry.markSpeaking();
          await playTalkVoiceReply({
            anamClient: input.anamClient,
            employeeId: input.employeeId,
            replyText,
            voiceMode: input.voiceMode,
          });
        } else {
          // Custom LLM output → Anam TTS/face via TalkMessageStream (one stream per turn).
          // Mic stays on the pre-acquired input MediaStream; talk only drives persona output.
          // @see https://anam.ai/docs/javascript-sdk/reference/talk-commands
          const talkStream = input.anamClient.createTalkMessageStream(turnId);

          replyText = await streamTalkBrainReply({
            employeeId: input.employeeId,
            sessionId: input.employeeSessionId,
            turnId,
            scenarioSessionId: input.scenarioSessionId,
            messages: pipelineMessages,
            signal: brainAbort.signal,
            onServerPerf: (payload) => {
              telemetry.mergeServerPerf(payload);
              if (payload.spans?.tool_loop) {
                telemetry.mergeServerPerf({
                  flags: { toolsUsed: true },
                });
              }
            },
            onChunk: async (chunk) => {
              if (chunk.trim()) {
                telemetry.markFirstBrainChunk();
                input.setPipelineState("speaking");
                telemetry.markSpeaking();
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

        mirrorTalkReplyToChat({
          text: replyText,
          sessionId: input.employeeSessionId,
        });
        pipelineCoordinator.completeTalkTurn(turnKey, replyText);
        input.setPipelineState("idle");
      } catch (error: unknown) {
        if (brainAbort.signal.aborted) {
          coordinator.failTalkTurn();
          return;
        }
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
        mirrorTalkReplyToChat({
          text: fallback,
          sessionId: input.employeeSessionId,
        });
        pipelineCoordinator.completeTalkTurn(turnKey, fallback);
        input.setPipelineState("idle");
      } finally {
        if (activeBrainAbort === brainAbort) {
          activeBrainAbort = null;
        }
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

    pendingTelemetry = createTalkTurnTelemetry(telemetryInput());
    pendingTelemetry.markSpeechDetected();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const messageContent = pendingMessage.content ?? "";
    if (isSubstantiveUserMessage(messageContent)) {
      void prefetchTalkQueryEmbeddingAction(
        input.employeeId,
        messageContent,
      ).catch(() => undefined);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!pendingHistory || !pendingMessage) {
        return;
      }

      processUserMessage(pendingHistory, pendingMessage, coordinator);
      pendingHistory = null;
      pendingMessage = null;
    }, resolveUserMessageDebounceMs(pendingMessage.content ?? ""));
  };

  const onInterrupted = (_correlationId?: string) => {
    activeBrainAbort?.abort();
    activeBrainAbort = null;
    processing = false;
    pendingTelemetry = null;
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
