import type { CreateEmployeeFormState, CreateEmployeeStep } from "./types";

export const CREATE_EMPLOYEE_STEPS: CreateEmployeeStep[] = [
  "identity",
  "avatar",
  "voice",
  "character",
  "brain",
  "knowledge",
  "summary",
];

export const STEP_LABELS: Record<CreateEmployeeStep, string> = {
  identity: "Identity",
  avatar: "Avatar",
  voice: "Voice",
  character: "Character",
  brain: "Brain",
  knowledge: "Knowledge",
  summary: "Summary",
};

export const MAX_AVATAR_UPLOAD_BYTES = Math.floor(4.5 * 1024 * 1024);

export const DEFAULT_BRAIN_PROVIDER = "openai" as const;

export const CUSTOM_BRAIN_PROVIDER_OPTIONS = [
  { value: "anthropic" as const, label: "Anthropic" },
  { value: "google" as const, label: "Google" },
  { value: "nullxes" as const, label: "NULLXES" },
  { value: "xai" as const, label: "xAI" },
] as const;

export function createInitialFormState(): CreateEmployeeFormState {
  return {
    name: "",
    role: "",
    photoFile: null,
    photoFileName: null,
    photoFileSize: null,
    avatarId: null,
    avatarPreviewUrl: null,
    personaId: null,
    avatarProvider: "anam",
    avatarGenerationStatus: "idle",
    avatarGenerationError: null,
    avatarSource: "upload",
    avatarPrompt: "",
    presetAvatarId: null,
    studioVoiceId: null,
    voiceId: null,
    voiceName: null,
    voiceProvider: null,
    voiceModel: null,
    voiceBinding: null,
    anamPersonaVoiceId: null,
    brainMode: "org_default",
    brainProvider: DEFAULT_BRAIN_PROVIDER,
    brainModel: "gpt-4.1-mini",
    orgDefaultBrainProvider: DEFAULT_BRAIN_PROVIDER,
    orgDefaultBrainModel: "gpt-4.1-mini",
    customElevenLabsVoiceId: "",
    characterPresetId: null,
    knowledgeUrl: "",
    knowledgeText: "",
    knowledgeFiles: [],
  };
}
