import type {
  CreateSessionInput,
  CreateSessionResult,
  HealthCheckResult,
  TerminateSessionInput,
  TerminateSessionResult,
} from "./types";

export interface SessionProvider {
  createSession(input: CreateSessionInput): Promise<CreateSessionResult>;
  terminateSession(
    input: TerminateSessionInput,
  ): Promise<TerminateSessionResult>;
  healthCheck(): Promise<HealthCheckResult>;
}
