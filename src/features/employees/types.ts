import type {
  AvatarProvider,
  BrainProvider,
  EmployeeStatus,
} from "@/entities/digital-employee";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";

export type EmployeeListItem = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  avatarProvider: AvatarProvider;
  brainProvider: BrainProvider;
  knowledgeSourcesCount: number;
  createdAt: Date;
  avatarPreviewUrl: string | null;
  avatarProvisioningStatus: ProviderProvisioningStatus;
  sessionVoiceProvider: string | null;
  canTalk: boolean;
};

export type EmployeeDetail = EmployeeListItem & {
  description: string | null;
  avatarId: string | null;
  personaId: string | null;
  studioVoiceId: string | null;
  voiceId: string | null;
  brainModel: string | null;
  brainProvisioningStatus: ProviderProvisioningStatus;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  systemPrompt: string;
};
