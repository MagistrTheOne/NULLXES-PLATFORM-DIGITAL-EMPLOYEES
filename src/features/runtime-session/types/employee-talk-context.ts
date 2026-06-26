import type { BrainProvider } from "@/entities/digital-employee";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";

export type EmployeeTalkContext = {
  id: string;
  name: string;
  role: string;
  organizationId: string;
  canTalk: boolean;
  avatarPreviewUrl: string | null;
  systemPrompt: string;
  brainProvider: BrainProvider;
  brainModel: string | null;
  avatarId: string | null;
  personaId: string | null;
  anamVoiceId: string | null;
  avatarProvisioningStatus: ProviderProvisioningStatus;
  avatarProviderMetadata: Record<string, unknown> | null;
  sessionVoiceProvider: string | null;
  voiceId: string | null;
  studioVoiceId: string | null;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  sessionProviderMetadata: Record<string, unknown> | null;
  temperature: number;
  maxTokens: number;
  sessionLimitSeconds: number;
  department: string | null;
};
