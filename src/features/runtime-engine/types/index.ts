import type { DigitalEmployee } from "@/entities/digital-employee";
import type {
  KnowledgeChunk,
  KnowledgeSource,
} from "@/entities/knowledge";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
} from "@/entities/provider-config";
import type { EmployeeRuntime } from "@/entities/runtime";

export type RuntimeContextLimits = {
  sessionLimitSeconds: number;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
};

export type RuntimeContextBrainProvider = {
  providerId: string;
  config: BrainProviderConfigPayload;
};

export type RuntimeContextAvatarProvider = {
  providerId: string;
  config: AvatarProviderConfigPayload;
};

export type RuntimeContextKnowledge = {
  sources: KnowledgeSource[];
  chunks: KnowledgeChunk[];
};

export type EmployeeRuntimeContext = {
  employee: DigitalEmployee;
  runtime: EmployeeRuntime;
  brainProvider: RuntimeContextBrainProvider;
  avatarProvider: RuntimeContextAvatarProvider;
  knowledge: RuntimeContextKnowledge;
  limits: RuntimeContextLimits;
};

export type BuildEmployeeRuntimeContextInput = {
  employeeId: string;
};
