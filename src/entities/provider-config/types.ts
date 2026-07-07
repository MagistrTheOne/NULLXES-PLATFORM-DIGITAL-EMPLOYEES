import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  employeeProviderConfig,
  providerConfigTypeEnum,
} from "./schema";

export type EmployeeProviderConfig = InferSelectModel<
  typeof employeeProviderConfig
>;
export type NewEmployeeProviderConfig = InferInsertModel<
  typeof employeeProviderConfig
>;

export type ProviderConfigType =
  (typeof providerConfigTypeEnum.enumValues)[number];

export type ProviderProvisioningStatus =
  | "pending"
  | "provisioning"
  | "ready"
  | "failed";

export type AvatarProviderConfigPayload = {
  avatarId?: string;
  personaId?: string;
  previewUrl?: string;
  quality?: string;
  imageUrl?: string;
  displayName?: string;
  photoFileName?: string;
  photoFileSize?: number;
  provisioningStatus?: ProviderProvisioningStatus;
  providerMetadata?: Record<string, unknown>;
};

export type BrainProviderConfigPayload = {
  model: string;
  temperature?: number;
  providerResourceId?: string;
  provisioningStatus?: ProviderProvisioningStatus;
  providerMetadata?: Record<string, unknown>;
};

export type SessionProviderConfigPayload = {
  roomType?: string;
  voiceProvider?: string;
  voiceId?: string;
  studioVoiceId?: string;
  modelId?: string;
  providerResourceId?: string;
  provisioningStatus?: ProviderProvisioningStatus;
  providerMetadata?: Record<string, unknown>;
  /** xAI Grok Voice Agent console id (e.g. agent_yLXnJLDucVtucCck). */
  xaiVoiceAgentId?: string;
  xaiVoiceEnabled?: boolean;
  /** When true, WebSocket uses agent_id and does not override console instructions. */
  xaiVoiceBindConsoleAgent?: boolean;
};
