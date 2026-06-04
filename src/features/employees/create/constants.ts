import type { CreateEmployeeFormState, CreateEmployeeStep } from "./types";

export const CREATE_EMPLOYEE_STEPS: CreateEmployeeStep[] = [
  "identity",
  "avatar",
  "voice",
  "brain",
  "knowledge",
  "summary",
];

export const STEP_LABELS: Record<CreateEmployeeStep, string> = {
  identity: "Identity",
  avatar: "Avatar",
  voice: "Voice",
  brain: "Brain",
  knowledge: "Knowledge",
  summary: "Summary",
};

export const MAX_AVATAR_UPLOAD_BYTES = Math.floor(4.5 * 1024 * 1024);

export const BRAIN_PROVIDER_OPTIONS = [
  { value: "openai" as const, label: "OpenAI" },
  { value: "anthropic" as const, label: "Anthropic" },
  { value: "google" as const, label: "Google" },
  { value: "nullxes" as const, label: "NULLXES" },
];

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
    studioVoiceId: null,
    voiceId: null,
    voiceName: null,
    voiceProvider: null,
    voiceModel: null,
    voiceBinding: null,
    anamPersonaVoiceId: null,
    brainProvider: "openai",
    knowledgeUrl: "",
    knowledgeText: "",
    knowledgeFiles: [],
  };
}
