import type { employeeSession } from "@/entities/session/schema";

type SessionStatus = typeof employeeSession.$inferSelect.status;

export type SessionLimitResult = {
  durationSeconds: number;
  status: SessionStatus;
  limitExceeded: boolean;
};

export function applySessionDurationLimit(input: {
  startedAt: Date;
  endedAt: Date;
  sessionLimitSeconds: number;
}): SessionLimitResult {
  const rawDuration = Math.max(
    0,
    Math.round((input.endedAt.getTime() - input.startedAt.getTime()) / 1000),
  );

  if (rawDuration <= input.sessionLimitSeconds) {
    return {
      durationSeconds: rawDuration,
      status: "completed",
      limitExceeded: false,
    };
  }

  return {
    durationSeconds: input.sessionLimitSeconds,
    status: "expired",
    limitExceeded: true,
  };
}
