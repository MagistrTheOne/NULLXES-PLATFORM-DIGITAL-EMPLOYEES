import type {
  CreateAvatarInput,
  CreateAvatarResult,
  DeleteAvatarInput,
  DeleteAvatarResult,
  HealthCheckResult,
  UpdateAvatarInput,
  UpdateAvatarResult,
} from "./types";

export interface AvatarProvider {
  createAvatar(input: CreateAvatarInput): Promise<CreateAvatarResult>;
  updateAvatar(input: UpdateAvatarInput): Promise<UpdateAvatarResult>;
  deleteAvatar(input: DeleteAvatarInput): Promise<DeleteAvatarResult>;
  healthCheck(): Promise<HealthCheckResult>;
}
