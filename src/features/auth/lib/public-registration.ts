/**
 * Public self-serve registration gate.
 * Default: closed (acquiring / invite-only period).
 * Set PUBLIC_REGISTRATION_ENABLED=true to reopen /register + email sign-up.
 */
export function isPublicRegistrationEnabled(): boolean {
  return process.env.PUBLIC_REGISTRATION_ENABLED?.trim() === "true";
}
