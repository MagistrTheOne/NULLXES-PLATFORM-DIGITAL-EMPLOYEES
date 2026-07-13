import "server-only";

import { getPublicAppUrl, sanitizeEnvValue } from "@/shared/config/env";

function readOptionalEnv(name: string): string | undefined {
  return sanitizeEnvValue(process.env[name]);
}

export function getTbankTerminalKey(): string | undefined {
  return readOptionalEnv("TBANK_TERMINAL_KEY");
}

export function getTbankPassword(): string | undefined {
  return readOptionalEnv("TBANK_PASSWORD");
}

/** Base host without /v2 — default production (DEMO terminals use securepay). */
export function getTbankApiBase(): string {
  return (
    readOptionalEnv("TBANK_API_BASE") ?? "https://securepay.tinkoff.ru"
  ).replace(/\/$/, "");
}

export function getTbankEnv(): "test" | "production" {
  return process.env.TBANK_ENV === "production" ? "production" : "test";
}

export function isTbankConfigured(): boolean {
  return Boolean(getTbankTerminalKey() && getTbankPassword());
}

export function getTbankSuccessUrl(): string {
  return (
    readOptionalEnv("TBANK_SUCCESS_URL") ??
    `${getPublicAppUrl()}/billing/tbank/success`
  );
}

export function getTbankFailUrl(): string {
  return (
    readOptionalEnv("TBANK_FAIL_URL") ??
    `${getPublicAppUrl()}/billing/tbank/fail`
  );
}

export function getTbankNotificationUrl(): string {
  return (
    readOptionalEnv("TBANK_NOTIFICATION_URL") ??
    `${getPublicAppUrl()}/api/billing/tbank/notification`
  );
}

/** When set (e.g. osn / usn_income), used in Receipt. Default usn_income for DEMO. */
export function getTbankTaxation(): string {
  return readOptionalEnv("TBANK_TAXATION") ?? "usn_income";
}

/** Receipt item VAT: none | vat0 | vat10 | vat20 | vat22 | … */
export function getTbankVat(): string {
  return readOptionalEnv("TBANK_VAT") ?? "none";
}

/** Receipt is on by default (bank fiscalization tests). Set TBANK_RECEIPT=0 to disable. */
export function isTbankReceiptEnabled(): boolean {
  const raw = readOptionalEnv("TBANK_RECEIPT");
  if (raw === "0" || raw === "false" || raw === "off") {
    return false;
  }
  return true;
}

/** Public label for auditors (never expose password). */
export function getTbankTerminalDisplay(): string | null {
  const key = getTbankTerminalKey();
  if (!key) return null;
  return key.includes("DEMO") ? `${key} · DEMO` : key;
}

/** Verification charge in kopecks (default 10 ₽). */
export function getTbankTestAmountKopecks(): number {
  const raw = readOptionalEnv("TBANK_TEST_AMOUNT_KOPECKS");
  const parsed = raw ? Number.parseInt(raw, 10) : 1000;
  return Number.isFinite(parsed) && parsed >= 100 ? parsed : 1000;
}
