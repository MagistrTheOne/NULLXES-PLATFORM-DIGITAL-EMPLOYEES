"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_POLICY_PATH,
  readCookieConsentFromDocument,
  writeCookieConsent,
} from "../lib/cookie-consent";
import { cn } from "@/lib/utils";

/**
 * Site-wide cookie notice. Choice is stored in first-party cookie
 * `nx_cookie_consent` (1 year) so the banner does not reappear every visit.
 */
export function CookieConsentBanner() {
  const t = useTranslations("common.cookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsentFromDocument() === null);
  }, []);

  if (!visible) {
    return null;
  }

  const accept = (value: "necessary" | "all") => {
    writeCookieConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="nx-cookie-consent-title"
      aria-describedby="nx-cookie-consent-desc"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0A]/95 p-4 shadow-[0_-20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md",
        "sm:p-5",
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <p
            id="nx-cookie-consent-title"
            className="text-sm font-medium tracking-tight text-white"
          >
            {t("title")}
          </p>
          <p
            id="nx-cookie-consent-desc"
            className="text-sm leading-relaxed text-white/55"
          >
            {t.rich("body", {
              policy: (chunks) => (
                <Link
                  href={COOKIE_CONSENT_POLICY_PATH}
                  className="underline underline-offset-4 transition hover:text-white"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
            onClick={() => accept("necessary")}
          >
            {t("necessaryOnly")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-white text-black hover:bg-white/90"
            onClick={() => accept("all")}
          >
            {t("acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
