"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  getElevenLabsApiKey,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";
import {
  ELEVENLABS_API_VOICE_ID_PREFIX,
  type StudioVoiceOption,
} from "../studio/voice/voice-catalog";
import { normalizeStudioVoiceGender } from "../studio/voice/normalize-studio-voice-gender";

type ElevenLabsVoiceResponse = {
  voices?: Array<{
    voice_id?: string;
    name?: string;
    labels?: Record<string, string>;
  }>;
};

export type ListElevenLabsStudioVoicesResult =
  | { ok: true; voices: StudioVoiceOption[] }
  | { ok: false; message: string };

export async function listElevenLabsStudioVoices(): Promise<ListElevenLabsStudioVoicesResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  if (!hasElevenLabsCredentials()) {
    return { ok: false, message: "ELEVENLABS_API_KEY is not configured" };
  }

  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return { ok: false, message: "ELEVENLABS_API_KEY is not configured" };
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `ElevenLabs voices request failed (${response.status})`,
      };
    }

    const payload = (await response.json()) as ElevenLabsVoiceResponse;
    const voices = (payload.voices ?? [])
      .filter((voice) => Boolean(voice.voice_id && voice.name))
      .map((voice) => ({
        id: `${ELEVENLABS_API_VOICE_ID_PREFIX}${voice.voice_id}`,
        name: voice.name!,
        gender: normalizeStudioVoiceGender(voice.labels?.gender),
        language: voice.labels?.language ?? voice.labels?.accent ?? "English",
        provider: "ElevenLabs" as const,
        elevenLabsVoiceId: voice.voice_id!,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return { ok: true, voices };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load ElevenLabs voices",
    };
  }
}
