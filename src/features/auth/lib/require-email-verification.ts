/** True when sign-in and registration require a verified email (opt-in via env). */
export function isRequireEmailVerificationEnabled(): boolean {
  return (
    process.env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase() === "true"
  );
}
