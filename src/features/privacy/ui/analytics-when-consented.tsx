"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsentFromDocument,
  type CookieConsentValue,
} from "../lib/cookie-consent";

/**
 * Loads Vercel Analytics only after the visitor accepts all cookies
 * (or previously stored `nx_cookie_consent=all`).
 */
export function AnalyticsWhenConsented() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = (value: CookieConsentValue | null) => {
      setAllowed(value === "all");
    };

    sync(readCookieConsentFromDocument());

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ value: CookieConsentValue }>)
        .detail;
      sync(detail?.value ?? readCookieConsentFromDocument());
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  if (!allowed) {
    return null;
  }

  return <Analytics />;
}
