import {
  getOpenAiApiBaseUrl,
  getOpenAiApiKey,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";

export async function transcribeVoiceMessage(audio: Blob): Promise<string> {
  if (!hasOpenAiCredentials()) {
    throw new Error("OpenAI API key is not configured");
  }

  const apiKey = getOpenAiApiKey();
  const file =
    audio instanceof File
      ? audio
      : new File([audio], "voice.webm", {
          type: audio.type || "audio/webm",
        });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");

  const response = await fetch(`${getOpenAiApiBaseUrl()}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper transcription failed with status ${response.status}`);
  }

  const data = (await response.json()) as { text?: string };
  const text = data.text?.trim();

  if (!text) {
    throw new Error("No speech detected in recording");
  }

  return text;
}
