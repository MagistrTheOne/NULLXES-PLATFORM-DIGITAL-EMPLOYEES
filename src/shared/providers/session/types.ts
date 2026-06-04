export type SessionProviderId = "nullxes" | "livekit" | "custom";

export type SessionProviderMetadata = {
  id: SessionProviderId;
  name: string;
  description: string;
};

export type CreateSessionInput = {
  employeeId: string;
  userId: string;
};

export type CreateSessionResult = {
  sessionId: string;
  providerId: SessionProviderId;
};

export type TerminateSessionInput = {
  sessionId: string;
};

export type TerminateSessionResult = {
  sessionId: string;
  terminated: boolean;
};

export type HealthCheckResult = {
  healthy: boolean;
  providerId: SessionProviderId;
};
