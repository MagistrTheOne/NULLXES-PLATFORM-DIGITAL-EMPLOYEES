import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * T-Bank request / notification Token (SHA-256).
 * @see https://developer.tbank.ru/eacq/intro/developer/token
 */
export function buildTbankToken(
  payload: Record<string, unknown>,
  password: string,
): string {
  const pairs: Array<{ key: string; value: string }> = [];

  for (const [key, value] of Object.entries(payload)) {
    if (key === "Token") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    pairs.push({ key, value: String(value) });
  }

  pairs.push({ key: "Password", value: password });
  pairs.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const concatenated = pairs.map((pair) => pair.value).join("");
  return createHash("sha256").update(concatenated, "utf8").digest("hex");
}

export function verifyTbankToken(
  payload: Record<string, unknown>,
  password: string,
): boolean {
  const received = payload.Token;
  if (typeof received !== "string" || received.length === 0) {
    return false;
  }

  const expected = buildTbankToken(payload, password);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
