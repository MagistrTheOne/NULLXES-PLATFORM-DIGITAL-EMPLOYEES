export const MAX_OPEN_SESSIONS_PER_USER = 3;

/** Soft cap across all free users talking to the same catalog persona. */
export const MAX_OPEN_SESSIONS_PER_CATALOG_EMPLOYEE = 12;

export class EmployeeSessionLimitError extends Error {
  readonly code = "SESSION_LIMIT" as const;

  constructor(
    message = "Too many active talk sessions. End one before starting another.",
  ) {
    super(message);
    this.name = "EmployeeSessionLimitError";
  }
}
