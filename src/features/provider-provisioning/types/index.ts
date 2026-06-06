import type { ProviderProvisioningStatus } from "@/entities/provider-config";

export const ELEVENLABS_VOICE_MODEL_ID = "eleven_v3" as const;

export const ANAM_EXTERNAL_LLM_ID = "CUSTOMER_CLIENT_V1" as const;

export type ProvisionProviderResult = {
  status: ProviderProvisioningStatus;
  providerResourceId?: string;
  providerMetadata?: Record<string, unknown>;
  failureReason?: string;
};

export type ProvisionBrainProviderInput = {
  employeeId: string;
  employeeName: string;
  /** Stored in OpenAI assistant instructions and employee_runtime at talk time. */
  systemPrompt: string;
};

/** Anam avatar provisioning — no employee systemPrompt; brain is OpenAI via CUSTOMER_CLIENT_V1. */
export type ProvisionAvatarProviderInput = {
  employeeId: string;
  employeeName: string;
  voiceId?: string;
};

export type ProvisionVoiceProviderInput = {
  employeeId: string;
  employeeName: string;
};

export type ProvisionEmployeeProvidersInput = {
  employeeId: string;
};

export type ProvisionEmployeeProvidersResult = {
  brain: ProvisionProviderResult;
  avatar: ProvisionProviderResult;
  voice: ProvisionProviderResult;
};
