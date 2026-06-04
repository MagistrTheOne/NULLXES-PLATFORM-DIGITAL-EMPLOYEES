import { headers } from "next/headers";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
import { auth } from "../server";

const MAX_ATTEMPTS = 5;

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

      await pause(250 * 2 ** attempt);
    }
  }

  throw lastError;
}
