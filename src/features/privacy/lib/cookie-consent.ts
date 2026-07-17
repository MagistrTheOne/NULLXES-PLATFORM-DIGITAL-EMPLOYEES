export const COOKIE_CONSENT_COOKIE = "nx_cookie_consent";
export const COOKIE_CONSENT_EVENT = "nx-cookie-consent";

/** Accepted values stored in the consent cookie. */
export type CookieConsentValue = "necessary" | "all";

export const COOKIE_CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export const COOKIE_CONSENT_POLICY_PATH = "/docs/cookies";

export function isCookieConsentValue(
  value: string | null | undefined,
): value is CookieConsentValue {
  return value === "necessary" || value === "all";
}

export function readCookieConsentFromDocument(): CookieConsentValue | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_COOKIE}=`));

  if (!match) {
    return null;
  }

  const raw = decodeURIComponent(match.slice(COOKIE_CONSENT_COOKIE.length + 1));
  return isCookieConsentValue(raw) ? raw : null;
}

export function writeCookieConsent(value: CookieConsentValue): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${COOKIE_CONSENT_MAX_AGE_SEC}`,
    "samesite=lax",
  ].join("; ");

  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: { value } }),
  );
}
