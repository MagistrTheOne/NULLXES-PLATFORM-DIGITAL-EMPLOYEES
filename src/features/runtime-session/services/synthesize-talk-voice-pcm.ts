import { ELEVENLABS_VOICE_MODEL_ID } from "@/features/provider-provisioning/types";
import {
  getElevenLabsApiBaseUrl,
  getElevenLabsApiKey,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";

export async function synthesizeTalkVoicePcm(
  voiceId: string,
  text: string,
): Promise<Uint8Array> {
  if (!hasElevenLabsCredentials()) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const apiKey = getElevenLabsApiKey();
  const response = await fetch(
    `${getElevenLabsApiBaseUrl()}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=pcm_16000`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey!,
        "Content-Type": "application/json",
        Accept: "audio/pcm",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_VOICE_MODEL_ID,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed with status ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
