import { eq } from "drizzle-orm";
import OpenAI from "openai";
import type { BrainProviderConfigPayload } from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import {
  getOpenAiApiKey,
  hasNullxesBrainCredentials,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import { db } from "@/shared/db/client";
import {
  buildDirectOpenAiBrainResourceId,
  isOpenAiAssistantsCompatibleModel,
} from "../lib/openai-assistants-compatible";
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

  const [employee] = await db
    .select({ brainProvider: digitalEmployee.brainProvider })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);

  if (employee?.brainProvider === "nullxes") {
    if (!hasNullxesBrainCredentials()) {
      const failure = toFailure("NULLXES_BRAIN_API_BASE_URL is not configured");
      await mergeProviderConfig(input.employeeId, "brain", {
        provisioningStatus: "failed",
        failureReason: failure.failureReason,
        providerMetadata: failure.providerMetadata,
      });
      return failure;
    }

    const providerMetadata = {
      provisionedAt: new Date().toISOString(),
      resourceType: "nullxes_shuten_vllm",
      model: config.model,
    };

    await mergeProviderConfig(input.employeeId, "brain", {
      provisioningStatus: "ready",
      providerMetadata,
      failureReason: undefined,
    });

    return {
      status: "ready",
      providerMetadata,
    };
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
    const useAssistantsApi = isOpenAiAssistantsCompatibleModel(config.model);

    if (!useAssistantsApi) {
      const providerResourceId = buildDirectOpenAiBrainResourceId(config.model);
      const providerMetadata = {
        provisionedAt: new Date().toISOString(),
        resourceType: "openai_chat_model",
        model: config.model,
        assistantsApiSkipped: true,
      };

      await mergeProviderConfig(input.employeeId, "brain", {
        provisioningStatus: "ready",
        providerResourceId,
        providerMetadata,
        failureReason: undefined,
      });

      return {
        status: "ready",
        providerResourceId,
        providerMetadata,
      };
    }

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
