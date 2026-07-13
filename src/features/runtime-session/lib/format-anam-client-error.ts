/**
 * Anam JS SDK ClientError often wraps the real upstream reason in `details.cause`.
 * Surface that so operators see "concurrent limit" instead of "Unknown error…".
 */
export function formatAnamClientError(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const details =
    "details" in error && error.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : null;
  const cause =
    typeof details?.cause === "string" && details.cause.trim().length > 0
      ? details.cause.trim()
      : null;

  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const statusCode =
    "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : null;

  const message = error.message.trim();

  if (
    code === "CLIENT_ERROR_CODE_MAX_CONCURRENT_SESSIONS_REACHED" ||
    /concurrent session limit/i.test(message) ||
    /concurrent session limit/i.test(cause ?? "")
  ) {
    return "Anam: лимит одновременных сессий. Закройте другие вкладки Talk или подождите 1–2 минуты и попробуйте снова.";
  }

  if (
    code === "CLIENT_ERROR_CODE_USAGE_LIMIT_REACHED" ||
    code === "CLIENT_ERROR_CODE_SPEND_CAP_REACHED"
  ) {
    return cause
      ? `Anam: лимит использования. ${cause}`
      : "Anam: лимит использования лаборатории. Попробуйте позже или смените API-ключ.";
  }

  if (code === "CLIENT_ERROR_CODE_AUTHENTICATION_ERROR") {
    return cause
      ? `Anam: ошибка авторизации. ${cause}`
      : "Anam: ошибка авторизации сессии. Обновите страницу и войдите снова.";
  }

  if (/unknown error when starting session/i.test(message)) {
    if (cause) {
      return `Anam: не удалось начать сессию (${statusCode ?? "?"}). ${cause}`;
    }
    return `Anam: не удалось начать сессию${statusCode ? ` (HTTP ${statusCode})` : ""}. Попробуйте ещё раз через минуту.`;
  }

  if (cause && cause !== message) {
    return `${message}: ${cause}`;
  }

  return message || fallback;
}
