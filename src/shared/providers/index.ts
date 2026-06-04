export type {
  AvatarProviderId,
  AvatarProviderMetadata,
  CreateAvatarInput,
  CreateAvatarResult,
} from "./avatar/types";
export type { AvatarProvider } from "./avatar/interfaces";
export {
  getAvatarProviderMetadata,
  listAvatarProviders,
  registerAvatarProvider,
  resolveAvatarProvider,
} from "./avatar/registry";

export type {
  BrainProviderId,
  BrainProviderMetadata,
  GenerateResponseInput,
  GenerateResponseResult,
} from "./brain/types";
export type { BrainProvider } from "./brain/interfaces";
export {
  getBrainProviderMetadata,
  listBrainProviders,
  registerBrainProvider,
  resolveBrainProvider,
} from "./brain/registry";

export type {
  SessionProviderId,
  SessionProviderMetadata,
  CreateSessionInput,
  CreateSessionResult,
} from "./session/types";
export type { SessionProvider } from "./session/interfaces";
export {
  getSessionProviderMetadata,
  listSessionProviders,
  registerSessionProvider,
  resolveSessionProvider,
} from "./session/registry";
