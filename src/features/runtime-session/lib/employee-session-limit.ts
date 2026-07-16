/** Soft DB caps only — Anam lab concurrent slots are the real ceiling. */
export const MAX_OPEN_SESSIONS_PER_USER = 6;

/**
 * Soft cap across all tenants talking to the same published catalog persona.
 * Sized for ~50–150 concurrent operators sharing a few catalog employees;
 * Anam engine slots remain the hard physical ceiling.
 */
export const MAX_OPEN_SESSIONS_PER_CATALOG_EMPLOYEE = 48;

/**
 * Fair-share cap: one workspace cannot monopolize live Talk / Anam capacity.
 */
export const MAX_OPEN_SESSIONS_PER_ORGANIZATION = 16;

export class EmployeeSessionLimitError extends Error {
  readonly code = "SESSION_LIMIT" as const;

  constructor(
    message = "Too many active talk sessions. End one before starting another.",
  ) {
    super(message);
    this.name = "EmployeeSessionLimitError";
  }
}
