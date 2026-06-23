import type { BrainProvider } from "@/entities/digital-employee";
import type {
  CreateEmployeeDraftPayload,
  KnowledgeDraftItem,
} from "../create/types";
import type { FinalizeEmployeeStudioSuccess } from "./finalize-employee-studio";

export function parseKnowledgeDraftJson(raw: string | null): KnowledgeDraftItem[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as KnowledgeDraftItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildStudioDraft(input: {
  studio: FinalizeEmployeeStudioSuccess;
  name: string;
  role: string;
  photoFileName: string | null;
  photoFileSize: number | null;
  brainProvider: BrainProvider;
  brainModel?: string;
  knowledge: KnowledgeDraftItem[];
}): CreateEmployeeDraftPayload {
  return {
    status: "draft",
    identity: {
      name: input.name.trim(),
      role: input.role.trim(),
    },
    avatar: {
      avatarId: input.studio.avatarId,
      previewUrl: input.studio.previewUrl,
      personaId: input.studio.personaId,
      provider: "anam",
      photoFileName: input.photoFileName,
      photoFileSize: input.photoFileSize,
      generateAvatarEnabled: true,
      anamPersonaVoiceId: input.studio.voice.anamPersonaVoiceId,
      voiceBinding: input.studio.voice.voiceBinding,
    },
    voice: {
      studioVoiceId: input.studio.voice.studioVoiceId,
      voiceId: input.studio.voice.voiceId,
      provider: input.studio.voice.provider,
      model: input.studio.voice.model,
    },
    brain: {
      mode: "custom",
      provider: input.brainProvider,
      model: input.brainModel ?? "gpt-4.1-mini",
    },
    knowledge: input.knowledge,
  };
}
