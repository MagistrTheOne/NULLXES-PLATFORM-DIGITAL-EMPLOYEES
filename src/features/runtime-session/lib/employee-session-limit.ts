export const MAX_OPEN_SESSIONS_PER_USER = 3;

export class EmployeeSessionLimitError extends Error {
  readonly code = "SESSION_LIMIT" as const;

  constructor() {
    super("Too many active talk sessions. End one before starting another.");
    this.name = "EmployeeSessionLimitError";
  }
}
