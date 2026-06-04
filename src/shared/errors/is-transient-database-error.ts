function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : String(message);
  }

  return String(error);
}

function isTransientMessage(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("fetch failed") ||
    normalized.includes("error connecting to database") ||
    normalized.includes("neondberror") ||
    normalized.includes("failed to get session") ||
    normalized.includes("econnreset") ||
    normalized.includes("etimedout") ||
    normalized.includes("socket hang up")
  );
}

export function isTransientDatabaseError(error: unknown): boolean {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);

    if (isTransientMessage(messageFromError(current))) {
      return true;
    }

    if (current instanceof Error && current.cause) {
      current = current.cause;
      continue;
    }

    if (typeof current === "object" && current !== null && "cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    break;
  }

  return false;
}
