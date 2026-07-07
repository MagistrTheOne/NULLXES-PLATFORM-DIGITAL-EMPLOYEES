import { getXaiApiKey } from "@/shared/config/xai-voice-env";

export type XaiVoiceClientSecret = {
  value: string;
  expiresAt?: string;
};

export async function createXaiVoiceClientSecret(): Promise<XaiVoiceClientSecret | null> {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { seconds: 300 },
      session: {
        reasoning: { effort: "none" },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    client_secret?: { value?: string; expires_at?: string };
    value?: string;
    expires_at?: string;
  };

  const value = payload.client_secret?.value ?? payload.value;
  if (!value) {
    return null;
  }

  return {
    value,
    expiresAt: payload.client_secret?.expires_at ?? payload.expires_at,
  };
}
