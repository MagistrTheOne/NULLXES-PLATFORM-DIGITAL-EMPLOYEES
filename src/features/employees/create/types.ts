import type { BrainProvider } from "@/entities/digital-employee";

export type CreateEmployeeStep =
  | "identity"
  | "avatar"
  | "voice"
  | "brain"
  | "knowledge"
  | "summary";

export type VoiceProvider = "elevenlabs";

export type AvatarGenerationStatus =
  | "idle"
  | "uploading"
  | "generating"
  | "ready"
  | "failed";

export type KnowledgeDraftItem =
  | { type: "file"; name: string; size: number }
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
  avatarProvider: "anam";
  avatarGenerationStatus: AvatarGenerationStatus;
  avatarGenerationError: string | null;
  voiceId: string | null;
  voiceName: string | null;
  voiceModel: "eleven_v3";
  brainProvider: BrainProvider;
  knowledgeUrl: string;
  knowledgeText: string;
  knowledgeFiles: Array<{ name: string; size: number }>;
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
    provider: "anam";
    photoFileName: string | null;
    photoFileSize: number | null;
    generateAvatarEnabled: true;
  };
  voice: {
    voiceId: string;
    provider: VoiceProvider;
    model: "eleven_v3";
  };
  brain: {
    provider: BrainProvider;
  };
  knowledge: KnowledgeDraftItem[];
};
