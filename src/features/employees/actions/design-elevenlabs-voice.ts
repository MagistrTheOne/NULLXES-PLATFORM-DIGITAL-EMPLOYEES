"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  getElevenLabsApiBaseUrl,
  getElevenLabsApiKey,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";

export type ElevenLabsVoiceDesignPreview = {
  generatedVoiceId: string;
  audioBase64: string;
  mediaType: string;
  durationSecs: number;
  language: string | null;
};

export type DesignElevenLabsVoiceResult =
  | {
      ok: true;
      previews: ElevenLabsVoiceDesignPreview[];
      previewText: string;
    }
  | { ok: false; message: string };

export type CreateElevenLabsVoiceResult =
  | { ok: true; voiceId: string; name: string }
  | { ok: false; message: string };

type DesignResponse = {
  previews?: Array<{
    generated_voice_id?: string;
    audio_base_64?: string;
    media_type?: string;
    duration_secs?: number;
    language?: string | null;
  }>;
  text?: string;
  detail?: unknown;
};

type CreateResponse = {
  voice_id?: string;
  name?: string;
  detail?: unknown;
};

function readElevenLabsError(payload: { detail?: unknown }, status: number): string {
  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  if (Array.isArray(payload.detail)) {
    const first = payload.detail[0] as { msg?: string } | undefined;
    if (first?.msg) {
      return first.msg;
    }
  }
  return `ElevenLabs request failed (${status})`;
}

async function requireElevenLabsAccess(): Promise<
  { ok: true; apiKey: string; baseUrl: string } | { ok: false; message: string }
> {
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

  return {
    ok: true,
    apiKey,
    baseUrl: getElevenLabsApiBaseUrl(),
  };
}

/**
 * ElevenLabs Voice Design — generate preview candidates from a text prompt.
 * @see https://elevenlabs.io/docs/api-reference/text-to-voice/design
 */
export async function designElevenLabsVoiceFromDescription(input: {
  voiceDescription: string;
  voiceName?: string;
}): Promise<DesignElevenLabsVoiceResult> {
  const access = await requireElevenLabsAccess();
  if (!access.ok) {
    return access;
  }

  const voiceDescription = input.voiceDescription.trim();
  if (voiceDescription.length < 8) {
    return {
      ok: false,
      message: "Describe the voice in more detail (at least a short sentence).",
    };
  }

  try {
    const response = await fetch(`${access.baseUrl}/v1/text-to-voice/design`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": access.apiKey,
      },
      body: JSON.stringify({
        voice_description: voiceDescription,
        auto_generate_text: true,
        model_id: "eleven_multilingual_ttv_v2",
        should_enhance: true,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as DesignResponse;

    if (!response.ok) {
      return { ok: false, message: readElevenLabsError(payload, response.status) };
    }

    const previews = (payload.previews ?? [])
      .filter(
        (preview) =>
          Boolean(preview.generated_voice_id) && Boolean(preview.audio_base_64),
      )
      .map((preview) => ({
        generatedVoiceId: preview.generated_voice_id!,
        audioBase64: preview.audio_base_64!,
        mediaType: preview.media_type ?? "audio/mpeg",
        durationSecs: preview.duration_secs ?? 0,
        language: preview.language ?? null,
      }));

    if (previews.length === 0) {
      return { ok: false, message: "ElevenLabs returned no voice previews." };
    }

    return {
      ok: true,
      previews,
      previewText: payload.text?.trim() || voiceDescription,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to design ElevenLabs voice",
    };
  }
}

/**
 * Persist a Voice Design preview into the ElevenLabs library.
 * @see https://elevenlabs.io/docs/api-reference/text-to-voice/create
 */
export async function createElevenLabsVoiceFromPreview(input: {
  voiceName: string;
  voiceDescription: string;
  generatedVoiceId: string;
}): Promise<CreateElevenLabsVoiceResult> {
  const access = await requireElevenLabsAccess();
  if (!access.ok) {
    return access;
  }

  const voiceName = input.voiceName.trim();
  const voiceDescription = input.voiceDescription.trim();
  const generatedVoiceId = input.generatedVoiceId.trim();

  if (!voiceName || !voiceDescription || !generatedVoiceId) {
    return { ok: false, message: "Voice name, description, and preview are required." };
  }

  try {
    const response = await fetch(`${access.baseUrl}/v1/text-to-voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": access.apiKey,
      },
      body: JSON.stringify({
        voice_name: voiceName,
        voice_description: voiceDescription,
        generated_voice_id: generatedVoiceId,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as CreateResponse;

    if (!response.ok) {
      return { ok: false, message: readElevenLabsError(payload, response.status) };
    }

    if (!payload.voice_id) {
      return { ok: false, message: "ElevenLabs did not return a voice_id." };
    }

    return {
      ok: true,
      voiceId: payload.voice_id,
      name: payload.name?.trim() || voiceName,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create ElevenLabs voice",
    };
  }
}
