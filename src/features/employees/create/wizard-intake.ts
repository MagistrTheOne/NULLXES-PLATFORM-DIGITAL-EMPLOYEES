import type { BrainProvider } from "@/entities/digital-employee";
import type { BrainAssignmentMode } from "@/features/brain";
import type { KnowledgeDraftItem, StudioVoiceProviderType } from "./types";

export type CreateEmployeeWizardInput = {
  name: string;
  role: string;
  brainMode: BrainAssignmentMode;
  brainProvider?: BrainProvider;
  brainModel?: string;
  studioVoiceId: string;
  customElevenLabsVoiceId?: string;
  voiceProvider: StudioVoiceProviderType;
  photoFileName: string | null;
  photoFileSize: number | null;
  presetAvatarId?: string | null;
  hasPhotoFile?: boolean;
  knowledge: KnowledgeDraftItem[];
  characterPresetId?: string | null;
};
