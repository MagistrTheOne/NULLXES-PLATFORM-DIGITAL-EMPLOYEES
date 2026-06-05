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

export function isMissingRelationError(error: unknown): boolean {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);

    const message = messageFromError(current).toLowerCase();

    if (
      message.includes('relation "organization_settings" does not exist') ||
      message.includes("organization_settings") && message.includes("does not exist")
    ) {
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
