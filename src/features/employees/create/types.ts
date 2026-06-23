import type { BrainProvider } from "@/entities/digital-employee";

export type CreateEmployeeStep =
  | "identity"
  | "avatar"
  | "voice"
  | "brain"
  | "knowledge"
  | "summary";

export type StudioVoiceProviderType = "anam" | "elevenlabs";

export type AvatarGenerationStatus =
  | "idle"
  | "uploading"
  | "generating"
  | "ready"
  | "failed";

export type KnowledgeDraftItem =
  | { type: "file"; name: string; size: number; content: string }
  | { type: "url"; url: string }
  | { type: "text"; content: string };

export type CreateEmployeeFormState = {
  name: string;
  role: string;
  photoFile: File | null;
  photoFileName: string | null;
  photoFileSize: number | null;
  avatarId: string | null;
  avatarPreviewUrl: string | null;
  personaId: string | null;
  avatarProvider: "anam";
  avatarGenerationStatus: AvatarGenerationStatus;
  avatarGenerationError: string | null;
  avatarSource: "upload" | "generate";
  avatarPrompt: string;
  studioVoiceId: string | null;
  voiceId: string | null;
  voiceName: string | null;
  voiceProvider: StudioVoiceProviderType | null;
  voiceModel: "eleven_v3" | null;
  voiceBinding: "anam" | "elevenlabs_shell" | null;
  anamPersonaVoiceId: string | null;
  brainProvider: BrainProvider;
  brainCustomModeEnabled: boolean;
  customElevenLabsVoiceId: string;
  knowledgeUrl: string;
  knowledgeText: string;
  knowledgeFiles: Array<{ name: string; size: number; content: string }>;
};

export type CreateEmployeeDraftPayload = {
  status: "draft";
  identity: {
    name: string;
    role: string;
  };
  avatar: {
    avatarId: string;
    previewUrl: string;
    personaId: string;
    provider: "anam";
    photoFileName: string | null;
    photoFileSize: number | null;
    generateAvatarEnabled: true;
    anamPersonaVoiceId: string;
    voiceBinding: "anam" | "elevenlabs_shell";
  };
  voice: {
    studioVoiceId: string;
    voiceId: string;
    provider: StudioVoiceProviderType;
    model: "eleven_v3" | null;
  };
  brain: {
    provider: BrainProvider;
  };
  knowledge: KnowledgeDraftItem[];
};
