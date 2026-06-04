import { loadEnvFiles } from "@/shared/config/load-env-files";

loadEnvFiles();

type ProviderCheck = {
  name: string;
  configured: boolean;
  healthy: boolean;
  detail: string;
};

async function checkOpenAi(): Promise<ProviderCheck> {
  const { getOpenAiApiKey, getOpenAiApiBaseUrl } = await import(
    "@/shared/config/provider-env"
  );
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return {
      name: "OpenAI",
      configured: false,
      healthy: false,
      detail: "OPENAI_API_KEY missing",
    };
  }

  try {
    const response = await fetch(`${getOpenAiApiBaseUrl()}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return {
      name: "OpenAI",
      configured: true,
      healthy: response.ok,
      detail: response.ok
        ? "API reachable"
        : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      name: "OpenAI",
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function checkAnam(): Promise<ProviderCheck> {
  const { getAnamApiKey, getAnamApiBaseUrl } = await import(
    "@/shared/config/provider-env"
  );
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    return {
      name: "Anam",
      configured: false,
      healthy: false,
      detail: "ANAM_API_KEY missing",
    };
  }

  try {
    const response = await fetch(`${getAnamApiBaseUrl()}/personas?perPage=1`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return {
      name: "Anam",
      configured: true,
      healthy: response.ok,
      detail: response.ok
        ? "API key valid (personas list OK)"
        : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      name: "Anam",
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function checkElevenLabs(): Promise<ProviderCheck> {
  const { getElevenLabsApiKey, getElevenLabsDefaultVoiceId } = await import(
    "@/shared/config/provider-env"
  );
  const { ElevenLabsClient } = await import("@elevenlabs/elevenlabs-js");
  const { ELEVENLABS_VOICE_MODEL_ID } = await import("./types");

  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return {
      name: "ElevenLabs",
      configured: false,
      healthy: false,
      detail: "ELEVENLABS_API_KEY missing",
    };
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    await client.textToSpeech.convert(getElevenLabsDefaultVoiceId(), {
      text: "NULLXES provider status check.",
      modelId: ELEVENLABS_VOICE_MODEL_ID,
      outputFormat: "mp3_44100_128",
    });
    return {
      name: "ElevenLabs",
      configured: true,
      healthy: true,
      detail: `API key valid (eleven_v3 TTS OK)`,
    };
  } catch (error) {
    return {
      name: "ElevenLabs",
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function main(): Promise<void> {
  const checks = await Promise.all([
    checkOpenAi(),
    checkAnam(),
    checkElevenLabs(),
  ]);

  console.log("Provider status (live API check):\n");
  for (const check of checks) {
    const status = !check.configured
      ? "NOT CONFIGURED"
      : check.healthy
        ? "OK"
        : "FAILED";
    console.log(`  ${check.name}: ${status}`);
    console.log(`    ${check.detail}`);
  }

  const allHealthy = checks.every((c) => c.configured && c.healthy);
  if (!allHealthy) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
