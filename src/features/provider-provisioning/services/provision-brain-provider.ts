import OpenAI from "openai";
import type { BrainProviderConfigPayload } from "@/entities/provider-config";
import {
  getOpenAiApiKey,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import type {
  ProvisionBrainProviderInput,
  ProvisionProviderResult,
} from "../types";
import { mergeProviderConfig } from "./update-provider-config";

function toFailure(message: string): ProvisionProviderResult {
  return {
    status: "failed",
    failureReason: message,
    providerMetadata: { failedAt: new Date().toISOString() },
  };
}

export async function provisionBrainProvider(
  input: ProvisionBrainProviderInput,
): Promise<ProvisionProviderResult> {
  const row = await mergeProviderConfig(input.employeeId, "brain", {
    provisioningStatus: "provisioning",
  });
  const config = row as BrainProviderConfigPayload;

  if (!config.model) {
    const failure = toFailure("Brain provider config is missing model");
    await mergeProviderConfig(input.employeeId, "brain", {
      provisioningStatus: "failed",
      providerMetadata: failure.providerMetadata,
      failureReason: failure.failureReason,
    });
    return failure;
  }

  if (!hasOpenAiCredentials()) {
    const failure = toFailure("OPENAI_API_KEY is not configured");
    await mergeProviderConfig(input.employeeId, "brain", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }

  try {
    const client = new OpenAI({ apiKey: getOpenAiApiKey() });
    const assistant = await client.beta.assistants.create({
      name: `${input.employeeName} Brain`,
      instructions: input.systemPrompt,
      model: config.model,
    });

    const providerMetadata = {
      provisionedAt: new Date().toISOString(),
      resourceType: "openai_assistant",
      model: config.model,
    };

    await mergeProviderConfig(input.employeeId, "brain", {
      provisioningStatus: "ready",
      providerResourceId: assistant.id,
      providerMetadata,
      failureReason: undefined,
    });

    return {
      status: "ready",
      providerResourceId: assistant.id,
      providerMetadata,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI provisioning failed";
    const failure = toFailure(message);
    await mergeProviderConfig(input.employeeId, "brain", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }
}
