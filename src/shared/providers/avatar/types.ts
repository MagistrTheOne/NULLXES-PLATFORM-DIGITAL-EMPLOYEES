export type AvatarProviderId = "anam" | "nullxes" | "custom";

export type AvatarProviderMetadata = {
  id: AvatarProviderId;
  name: string;
  description: string;
};

export type CreateAvatarInput = {
  employeeId: string;
  name: string;
};

export type CreateAvatarResult = {
  avatarId: string;
  providerId: AvatarProviderId;
};

export type UpdateAvatarInput = {
  avatarId: string;
  name?: string;
};

export type UpdateAvatarResult = {
  avatarId: string;
  updated: boolean;
};

export type DeleteAvatarInput = {
  avatarId: string;
};

export type DeleteAvatarResult = {
  avatarId: string;
  deleted: boolean;
};

export type HealthCheckResult = {
  healthy: boolean;
  providerId: AvatarProviderId;
};
