import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

const DEFAULT_MAX_ATTEMPTS = 5;

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      if (!isTransientDatabaseError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      await pause(250 * 2 ** attempt);
    }
  }

  throw lastError;
}
