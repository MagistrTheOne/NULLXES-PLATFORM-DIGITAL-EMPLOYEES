import type { BrainProvider } from "@/entities/digital-employee";

export type CreateEmployeeStep =
  | "identity"
  | "avatar"
  | "voice"
  | "brain"
  | "knowledge"
  | "summary";

export type VoiceProvider = "elevenlabs" | "deepgram" | "custom";

export type KnowledgeDraftItem =
  | { type: "file"; name: string; size: number }
  | { type: "url"; url: string }
  | { type: "text"; content: string };

export type CreateEmployeeFormState = {
  name: string;
  role: string;
  photoFileName: string | null;
  photoFileSize: number | null;
  voiceProvider: VoiceProvider;
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
    photoFileName: string | null;
    photoFileSize: number | null;
    generateAvatarEnabled: false;
    avatarProvider: "custom";
  };
  voice: {
    provider: VoiceProvider;
  };
  brain: {
    provider: BrainProvider;
  };
  knowledge: KnowledgeDraftItem[];
};
