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

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function walkErrorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);

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

  return chain;
}

export function isMissingRelationError(error: unknown): boolean {
  for (const current of walkErrorChain(error)) {
    const message = messageFromError(current).toLowerCase();

    if (
      message.includes('relation "organization_settings" does not exist') ||
      (message.includes("organization_settings") && message.includes("does not exist"))
    ) {
      return true;
    }
  }

  return false;
}

export function isPendingOrganizationSettingsMigrationError(
  error: unknown,
): boolean {
  for (const current of walkErrorChain(error)) {
    const message = messageFromError(current).toLowerCase();

    if (readErrorCode(current) === "42703" && message.includes("organization_settings")) {
      return true;
    }

    if (
      message.includes("default_brain_model") &&
      (message.includes("does not exist") || message.includes("42703"))
    ) {
      return true;
    }
  }

  return false;
}
