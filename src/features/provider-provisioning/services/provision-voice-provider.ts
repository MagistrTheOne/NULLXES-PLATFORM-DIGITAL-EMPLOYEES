import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import {
  getElevenLabsApiKey,
  getElevenLabsDefaultVoiceId,
  hasElevenLabsCredentials,
} from "@/shared/config/provider-env";
import type {
  ProvisionProviderResult,
  ProvisionVoiceProviderInput,
} from "../types";
import { ELEVENLABS_VOICE_MODEL_ID } from "../types";
import { getProviderConfigRow, mergeProviderConfig } from "./update-provider-config";

function toFailure(message: string): ProvisionProviderResult {
  return {
    status: "failed",
    failureReason: message,
    providerMetadata: { failedAt: new Date().toISOString() },
  };
}

export async function provisionVoiceProvider(
  input: ProvisionVoiceProviderInput,
): Promise<ProvisionProviderResult> {
  const existing = await getProviderConfigRow(input.employeeId, "session");
  if (!existing) {
    return toFailure("Voice provider config is missing");
  }

  const config = existing.config as SessionProviderConfigPayload;
  if (config.voiceProvider !== "elevenlabs") {
    return {
      status: "ready",
      providerMetadata: { skipped: true, reason: "voice_provider_not_elevenlabs" },
    };
  }

  await mergeProviderConfig(input.employeeId, "session", {
    provisioningStatus: "provisioning",
  });

  if (!hasElevenLabsCredentials()) {
    const failure = toFailure("ELEVENLABS_API_KEY is not configured");
    await mergeProviderConfig(input.employeeId, "session", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }

  const voiceId = getElevenLabsDefaultVoiceId();
  const modelId = ELEVENLABS_VOICE_MODEL_ID;

  try {
    const client = new ElevenLabsClient({ apiKey: getElevenLabsApiKey() });
    await client.textToSpeech.convert(voiceId, {
      text: `NULLXES voice provisioning check for ${input.employeeName}.`,
      modelId,
      outputFormat: "mp3_44100_128",
    });

    const providerMetadata = {
      provisionedAt: new Date().toISOString(),
      resourceType: "elevenlabs_voice",
      outputFormat: "mp3_44100_128",
    };

    await mergeProviderConfig(input.employeeId, "session", {
      provisioningStatus: "ready",
      voiceId,
      modelId,
      providerResourceId: voiceId,
      providerMetadata,
      failureReason: undefined,
    });

    return {
      status: "ready",
      providerResourceId: voiceId,
      providerMetadata: { ...providerMetadata, modelId },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "ElevenLabs voice provisioning failed";
    const failure = toFailure(message);
    await mergeProviderConfig(input.employeeId, "session", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }
}
