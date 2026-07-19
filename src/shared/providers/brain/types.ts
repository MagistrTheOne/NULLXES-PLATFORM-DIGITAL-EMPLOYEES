export type BrainProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "nullxes"
  | "xai";

export type BrainProviderMetadata = {
  id: BrainProviderId;
  name: string;
  description: string;
};

export type GenerateResponseInput = {
  employeeId: string;
  prompt: string;
  systemPrompt?: string;
};

export type GenerateResponseResult = {
  text: string;
  providerId: BrainProviderId;
};

export type HealthCheckResult = {
  healthy: boolean;
  providerId: BrainProviderId;
};
