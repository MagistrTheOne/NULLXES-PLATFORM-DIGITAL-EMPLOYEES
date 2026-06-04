import { headers } from "next/headers";
import { auth } from "../server";

const MAX_ATTEMPTS = 3;

function isTransientDatabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("fetch failed") ||
    message.includes("Error connecting to database") ||
    message.includes("NeonDbError")
  );
}

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurrentSession() {
  const requestHeaders = await headers();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await auth.api.getSession({
        headers: requestHeaders,
      });
    } catch (error: unknown) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === MAX_ATTEMPTS - 1) {
        throw error;
      }
      await pause(200 * (attempt + 1));
    }
  }

  throw lastError;
}
