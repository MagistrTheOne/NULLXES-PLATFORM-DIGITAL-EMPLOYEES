import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-current-session";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

async function loadRequiredSession() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      redirect("/login");
    }

    return session;
  } catch (error: unknown) {
    // Let transient DB errors bubble up so page-level error boundaries
    // (which know how to show "Не удалось подключиться к базе данных")
    // can render a friendly retry screen instead of a hard 500 crash.
    if (isTransientDatabaseError(error)) {
      // Re-throw a clean error that is still recognizable as transient DB.
      throw new Error("Failed to get session: database temporarily unreachable");
    }
    throw error;
  }
}

export const requireAuth = cache(loadRequiredSession);
