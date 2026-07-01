import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets (tokens, signatures).
 *
 * Hashing both inputs to a fixed 32-byte digest before `timingSafeEqual`
 * avoids leaking length via the early length check and satisfies the
 * equal-length requirement of `timingSafeEqual`. A plain `===` on secrets
 * leaks a byte-by-byte timing side channel (OWASP A04:2025).
 */
export function timingSafeStringEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) {
    return false;
  }

  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();

  return timingSafeEqual(digestA, digestB);
}
