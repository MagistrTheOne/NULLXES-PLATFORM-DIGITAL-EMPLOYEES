import type { BrainProvider } from "@/entities/digital-employee";
import type { KnowledgeDraftItem, StudioVoiceProviderType } from "./types";

export type CreateEmployeeWizardInput = {
  name: string;
  role: string;
  brainProvider: BrainProvider;
  studioVoiceId: string;
  customElevenLabsVoiceId?: string;
  voiceProvider: StudioVoiceProviderType;
  photoFileName: string | null;
  photoFileSize: number | null;
  knowledge: KnowledgeDraftItem[];
};
