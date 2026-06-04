import type {
  GenerateResponseInput,
  GenerateResponseResult,
  HealthCheckResult,
} from "./types";

export interface BrainProvider {
  generateResponse(
    input: GenerateResponseInput,
  ): Promise<GenerateResponseResult>;
  healthCheck(): Promise<HealthCheckResult>;
}
