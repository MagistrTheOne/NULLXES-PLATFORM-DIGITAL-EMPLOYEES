import type { AnamClient } from "@anam-ai/js-sdk";
import { AnamEvent, MessageRole } from "@anam-ai/js-sdk";
import type { Message } from "@anam-ai/js-sdk";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { playTalkVoiceReply } from "./play-talk-voice-reply";
import { streamTalkBrainReply } from "./stream-talk-brain-client";
import { postTalkEmployeeChatReply } from "./talk-reply-bridge";

export function attachTalkVoicePipeline(input: {
  anamClient: AnamClient;
  employeeId: string;
  voiceMode: TalkVoiceMode;
}): () => void {
  let processing = false;
  let lastHandledMessageId: string | null = null;

  const handleMessageHistory = (messageHistory: Message[]) => {
    if (processing || messageHistory.length === 0) {
      return;
    }

    const lastMessage = messageHistory[messageHistory.length - 1];
    if (
      lastMessage.role !== MessageRole.USER ||
      lastMessage.id === lastHandledMessageId
    ) {
      return;
    }

    lastHandledMessageId = lastMessage.id;
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
      } catch {
        const fallback =
          "Something went wrong while generating a response. Please try again.";
        await input.anamClient.talk(fallback);
        await postTalkEmployeeChatReply(fallback);
      } finally {
        processing = false;
      }
    })();
  };

  const onInterrupted = () => {
    processing = false;
  };

  input.anamClient.addListener(
    AnamEvent.MESSAGE_HISTORY_UPDATED,
    handleMessageHistory,
  );
  input.anamClient.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, onInterrupted);

  return () => {
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
