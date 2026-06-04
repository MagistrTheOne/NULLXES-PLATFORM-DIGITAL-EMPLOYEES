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

export type AvatarProviderConfigPayload = {
  avatarId: string;
  quality?: string;
};

export type BrainProviderConfigPayload = {
  model: string;
  temperature?: number;
};

export type SessionProviderConfigPayload = {
  roomType: string;
};
