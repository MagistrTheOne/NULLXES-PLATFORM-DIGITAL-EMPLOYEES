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

export const VOICE_PROVIDER_OPTIONS = [
  { value: "elevenlabs" as const, label: "ElevenLabs" },
  { value: "deepgram" as const, label: "Deepgram" },
  { value: "custom" as const, label: "Custom" },
];

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
    photoFileName: null,
    photoFileSize: null,
    voiceProvider: "elevenlabs",
    brainProvider: "openai",
    knowledgeUrl: "",
    knowledgeText: "",
    knowledgeFiles: [],
  };
}
