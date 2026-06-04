"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ELEVENLABS_VOICE_MODEL_ID } from "@/features/provider-provisioning/types";
import { STUDIO_VOICE_PREVIEW_TEXT } from "@/features/employees/studio/voice/voice-catalog";
import {
  getElevenLabsApiKey,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";

export type PreviewEmployeeVoiceSuccess = {
  status: "ready";
  audioBase64: string;
  contentType: "audio/mpeg";
};

export type PreviewEmployeeVoiceFailure = {
  status: "failed";
  message: string;
};

export type PreviewEmployeeVoiceResult =
  | PreviewEmployeeVoiceSuccess
  | PreviewEmployeeVoiceFailure;

function formatPreviewFailureMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Voice preview failed";
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("network")
  ) {
    return "ElevenLabs preview is unavailable. Check ELEVENLABS_API_KEY and network access, then try again.";
  }

  if (normalized.includes("401") || normalized.includes("unauthorized")) {
    return "ElevenLabs API key was rejected. Verify ELEVENLABS_API_KEY in your environment.";
  }

  if (normalized.includes("403") || normalized.includes("forbidden")) {
    return "ElevenLabs denied this request (region or permissions). Preview is optional — you can continue.";
  }

  return raw;
}

async function readAudioToBase64(audio: unknown): Promise<string> {
  if (audio instanceof ReadableStream) {
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return Buffer.from(merged).toString("base64");
  }

  if (audio instanceof ArrayBuffer) {
    return Buffer.from(audio).toString("base64");
  }

  if (Buffer.isBuffer(audio)) {
    return audio.toString("base64");
  }

  if (typeof Blob !== "undefined" && audio instanceof Blob) {
    const buffer = await audio.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  }

  throw new Error("Unsupported audio response format");
}

export async function previewEmployeeVoice(
  voiceId: string,
): Promise<PreviewEmployeeVoiceResult> {
  await requireAuth();

  if (!voiceId.trim()) {
    return { status: "failed", message: "Voice ID is required" };
  }

  if (!hasElevenLabsCredentials()) {
    return { status: "failed", message: "ELEVENLABS_API_KEY is not configured" };
  }

  try {
    const client = new ElevenLabsClient({ apiKey: getElevenLabsApiKey() });
    const audio = await client.textToSpeech.convert(voiceId, {
      text: STUDIO_VOICE_PREVIEW_TEXT,
      modelId: ELEVENLABS_VOICE_MODEL_ID,
      outputFormat: "mp3_44100_128",
    });

    const audioBase64 = await readAudioToBase64(audio);

    return {
      status: "ready",
      audioBase64,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    return {
      status: "failed",
      message: formatPreviewFailureMessage(error),
    };
  }
}
