import type { AnamClient } from "@anam-ai/js-sdk";
import { AnamEvent, MessageRole } from "@anam-ai/js-sdk";
import type { Message } from "@anam-ai/js-sdk";
import { processTalkTurnAction } from "../actions/talk-voice-pipeline";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";

const PCM_CHUNK_BYTES = 4096;

function base64ToUint8Array(pcmBase64: string): Uint8Array {
  const binary = atob(pcmBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function splitPcmBase64(pcmBase64: string): Uint8Array[] {
  const bytes = base64ToUint8Array(pcmBase64);
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < bytes.length; offset += PCM_CHUNK_BYTES) {
    chunks.push(bytes.slice(offset, offset + PCM_CHUNK_BYTES));
  }

  return chunks;
}

async function streamReplyWithAnamVoice(
  anamClient: AnamClient,
  replyText: string,
): Promise<void> {
  const talkStream = anamClient.createTalkMessageStream();
  const words = replyText.split(/(\s+)/).filter((part) => part.length > 0);

  for (const part of words) {
    if (!talkStream.isActive()) {
      break;
    }
    await talkStream.streamMessageChunk(part, false);
  }

  if (talkStream.isActive()) {
    await talkStream.endMessage();
  }
}

async function playReplyWithElevenLabsVoice(
  anamClient: AnamClient,
  pcmBase64: string,
): Promise<void> {
  const audioInputStream = anamClient.createAgentAudioInputStream({
    encoding: "pcm_s16le",
    sampleRate: 16000,
    channels: 1,
  });

  for (const chunk of splitPcmBase64(pcmBase64)) {
    audioInputStream.sendAudioChunk(chunk);
  }

  audioInputStream.endSequence();
}

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
        const result = await processTalkTurnAction(
          input.employeeId,
          messageHistory.map((message) => ({
            role: message.role === MessageRole.USER ? "user" : "persona",
            content: message.content,
          })),
        );

        if (!result.ok) {
          await input.anamClient.talk(
            "I could not process that right now. Please try again.",
          );
          return;
        }

        if (
          input.voiceMode === "elevenlabs" &&
          result.pcmBase64 &&
          result.voiceMode === "elevenlabs"
        ) {
          await playReplyWithElevenLabsVoice(
            input.anamClient,
            result.pcmBase64,
          );
        } else {
          await streamReplyWithAnamVoice(input.anamClient, result.replyText);
        }
      } catch {
        await input.anamClient.talk(
          "Something went wrong while generating a response.",
        );
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
