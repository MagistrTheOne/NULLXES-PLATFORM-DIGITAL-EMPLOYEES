import { provisionAvatarProvider } from "../services/provision-avatar-provider";
import { provisionBrainProvider } from "../services/provision-brain-provider";
import { provisionVoiceProvider } from "../services/provision-voice-provider";

export const avatarProvisioner = provisionAvatarProvider;
export const brainProvisioner = provisionBrainProvider;
export const voiceProvisioner = provisionVoiceProvider;
