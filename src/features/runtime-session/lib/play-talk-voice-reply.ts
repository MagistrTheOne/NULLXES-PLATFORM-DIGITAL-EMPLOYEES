import type { AnamClient } from "@anam-ai/js-sdk";
import { synthesizeTalkVoiceAction } from "../actions/talk-voice-pipeline";
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

async function streamReplyWithAnamVoice(
  anamClient: AnamClient,
  replyText: string,
  correlationId?: string,
): Promise<void> {
  const talkStream = anamClient.createTalkMessageStream(correlationId);
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
): Promise<boolean> {
  try {
    const audioInputStream = anamClient.createAgentAudioInputStream({
      encoding: "pcm_s16le",
      sampleRate: 16000,
      channels: 1,
    });

    const bytes = base64ToUint8Array(pcmBase64);
    for (let offset = 0; offset < bytes.length; offset += PCM_CHUNK_BYTES) {
      audioInputStream.sendAudioChunk(bytes.slice(offset, offset + PCM_CHUNK_BYTES));
    }

    audioInputStream.endSequence();
    return true;
  } catch {
    return false;
  }
}

export async function playTalkVoiceReply(input: {
  anamClient: AnamClient;
  employeeId: string;
  replyText: string;
  voiceMode: TalkVoiceMode;
}): Promise<void> {
  if (input.voiceMode === "elevenlabs") {
    const synthesized = await synthesizeTalkVoiceAction(
      input.employeeId,
      input.replyText,
    );
    if (!synthesized.ok) {
      await streamReplyWithAnamVoice(input.anamClient, input.replyText);
      return;
    }
    await playReplyWithElevenLabsVoice(
      input.anamClient,
      synthesized.pcmBase64,
    ).then((played) => {
      if (!played) {
        return streamReplyWithAnamVoice(input.anamClient, input.replyText);
      }
      return undefined;
    });
    return;
  }

  await streamReplyWithAnamVoice(input.anamClient, input.replyText);
}
