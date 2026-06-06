import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";
import type {
  ProvisionEmployeeProvidersInput,
  ProvisionEmployeeProvidersResult,
} from "../types";
import { provisionAvatarProvider } from "./provision-avatar-provider";
import { provisionBrainProvider } from "./provision-brain-provider";
import { provisionVoiceProvider } from "./provision-voice-provider";
import { getProviderConfigRow } from "./update-provider-config";

async function loadEmployeeContext(employeeId: string): Promise<{
  name: string;
  systemPrompt: string;
  voiceId?: string;
}> {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    throw new Error("Digital employee not found for provisioning");
  }

  const [runtime] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  const avatarConfig = await getProviderConfigRow(employeeId, "avatar");
  const avatarPayload =
    avatarConfig?.config && typeof avatarConfig.config === "object"
      ? (avatarConfig.config as {
          providerMetadata?: { anamPersonaVoiceId?: string };
        })
      : undefined;

  const anamPersonaVoiceId =
    avatarPayload?.providerMetadata?.anamPersonaVoiceId;

  return {
    name: employee.name,
    systemPrompt:
      runtime?.systemPrompt ??
      `You are ${employee.name}, a ${employee.role ?? "digital employee"}.`,
    voiceId: anamPersonaVoiceId,
  };
}

export async function provisionEmployeeProviders(
  input: ProvisionEmployeeProvidersInput,
): Promise<ProvisionEmployeeProvidersResult> {
  const context = await loadEmployeeContext(input.employeeId);

  const [brain, avatar, voice] = await Promise.all([
    provisionBrainProvider({
      employeeId: input.employeeId,
      employeeName: context.name,
      systemPrompt: context.systemPrompt,
    }).catch((error: unknown) => ({
      status: "failed" as const,
      failureReason:
        error instanceof Error ? error.message : "Brain provisioning crashed",
      providerMetadata: { failedAt: new Date().toISOString() },
    })),
    provisionAvatarProvider({
      employeeId: input.employeeId,
      employeeName: context.name,
      voiceId: context.voiceId,
    }).catch((error: unknown) => ({
      status: "failed" as const,
      failureReason:
        error instanceof Error ? error.message : "Avatar provisioning crashed",
      providerMetadata: { failedAt: new Date().toISOString() },
    })),
    provisionVoiceProvider({
      employeeId: input.employeeId,
      employeeName: context.name,
    }).catch((error: unknown) => ({
      status: "failed" as const,
      failureReason:
        error instanceof Error ? error.message : "Voice provisioning crashed",
      providerMetadata: { failedAt: new Date().toISOString() },
    })),
  ]);

  return { brain, avatar, voice };
}
