import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_MAX_TOTAL_MS = 8_000;

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  maxTotalMs = DEFAULT_MAX_TOTAL_MS,
): Promise<T> {
  let lastError: unknown;
  const startedAt = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      const elapsedMs = Date.now() - startedAt;
      const hasAttemptsLeft = attempt < maxAttempts - 1;
      const canRetry =
        isTransientDatabaseError(error) &&
        hasAttemptsLeft &&
        elapsedMs < maxTotalMs;

      if (!canRetry) {
        throw error;
      }

      const backoffMs = 250 * 2 ** attempt;
      const remainingMs = maxTotalMs - elapsedMs;

      await pause(Math.min(backoffMs, remainingMs));
    }
  }

  throw lastError;
}
