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
  modelId?: string;
  providerResourceId?: string;
  provisioningStatus?: ProviderProvisioningStatus;
  providerMetadata?: Record<string, unknown>;
};
