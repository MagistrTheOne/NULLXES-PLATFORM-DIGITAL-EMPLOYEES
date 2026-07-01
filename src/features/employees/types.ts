import type {
  AvatarProvider,
  BrainProvider,
  EmployeeStatus,
} from "@/entities/digital-employee";
import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";
import type {
  KnowledgeSourceStatus,
  KnowledgeSourceType,
} from "@/entities/knowledge";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";

export type EmployeeKnowledgeItem = {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  status: KnowledgeSourceStatus;
  failureReason: string | null;
  chunkCount: number;
  createdAt: Date;
};

export type EmployeeLifecycleItem = {
  id: string;
  eventType: EmployeeLifecycleEventType;
  reason: string | null;
  actorName: string;
  createdAt: Date;
};

export type EmployeeHandoffItem = {
  id: string;
  direction: "incoming" | "outgoing";
  counterpartName: string;
  status: string;
  reason: string | null;
  taskId: string | null;
  createdAt: Date;
};

export type EmployeeListItem = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  status: EmployeeStatus;
  avatarProvider: AvatarProvider;
  brainProvider: BrainProvider;
  knowledgeSourcesCount: number;
  createdAt: Date;
  avatarPreviewUrl: string | null;
  avatarProvisioningStatus: ProviderProvisioningStatus;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  avatarProvisioningFailureReason: string | null;
  sessionProvisioningFailureReason: string | null;
  sessionVoiceProvider: string | null;
  canTalk: boolean;
};

export type EmployeeDetailShell = EmployeeListItem & {
  description: string | null;
  avatarId: string | null;
  personaId: string | null;
  anamApiKeySlot: string | null;
  anamVoiceId: string | null;
  voiceBinding: string | null;
  studioVoiceId: string | null;
  voiceId: string | null;
  brainModel: string | null;
  brainProvisioningStatus: ProviderProvisioningStatus;
  brainProvisioningFailureReason: string | null;
  systemPrompt: string;
};

export type EmployeeDetail = EmployeeDetailShell & {
  description: string | null;
  avatarId: string | null;
  personaId: string | null;
  anamVoiceId: string | null;
  studioVoiceId: string | null;
  voiceId: string | null;
  brainModel: string | null;
  brainProvisioningStatus: ProviderProvisioningStatus;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  systemPrompt: string;
  knowledge: EmployeeKnowledgeItem[];
  lifecycle: EmployeeLifecycleItem[];
  handoffs: EmployeeHandoffItem[];
};
