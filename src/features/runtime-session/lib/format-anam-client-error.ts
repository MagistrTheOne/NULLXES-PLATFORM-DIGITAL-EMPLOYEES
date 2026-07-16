/**
 * Anam JS SDK ClientError often wraps the real upstream reason in `details.cause`.
 * Surface that so operators see "concurrent limit" instead of "Unknown error…".
 */

import {
  pickPreferredAnamVideoDimension,
  type AnamTalkSessionVideoOptions,
} from "./anam-session-tuning";

function readErrorDetails(error: Error): Record<string, unknown> | null {
  if (!("details" in error) || !error.details || typeof error.details !== "object") {
    return null;
  }
  return error.details as Record<string, unknown>;
}

function readErrorCause(error: Error): string {
  const details = readErrorDetails(error);
  return typeof details?.cause === "string" && details.cause.trim().length > 0
    ? details.cause.trim()
    : "";
}

export function isAnamConcurrentSessionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = readErrorCause(error);
  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const message = error.message.trim();

  return (
    code === "CLIENT_ERROR_CODE_MAX_CONCURRENT_SESSIONS_REACHED" ||
    /concurrent session limit/i.test(message) ||
    /concurrent session limit/i.test(cause) ||
    /лимит одновременных сессий/i.test(message)
  );
}

export function isAnamVideoDimensionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = readErrorCause(error);
  const haystack = `${error.message} ${cause}`;

  return (
    /video dimensions .+ are not supported/i.test(haystack) ||
    /video_dimensions_not_supported/i.test(haystack)
  );
}

/** Pull supported dims from Anam engine/session 400 payloads for remint. */
export function extractAnamVideoOptionsFromError(
  error: unknown,
): AnamTalkSessionVideoOptions | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const cause = readErrorCause(error);
  const haystack = `${error.message}\n${cause}`;

  const tokens: string[] = [];
  try {
    const jsonMatch = /\{[\s\S]*"supportedDimensions"[\s\S]*\}/.exec(haystack);
    if (jsonMatch?.[0]) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        supportedDimensions?: string[];
      };
      if (Array.isArray(parsed.supportedDimensions)) {
        tokens.push(...parsed.supportedDimensions);
      }
    }
  } catch {
    // ignore malformed JSON in cause
  }

  const listMatch = /Supported dimensions:\s*([^.]+)/i.exec(haystack);
  if (listMatch?.[1]) {
    tokens.push(
      ...listMatch[1]
        .split(/[,;]/)
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }

  const preferred = pickPreferredAnamVideoDimension(tokens);
  if (!preferred) {
    // Engine rejected cara-3 size → try cara-4 landscape; else flip back.
    if (/720\s*[x×]\s*480/i.test(haystack) && /cara-4/i.test(haystack)) {
      return { videoWidth: 1152, videoHeight: 768 };
    }
    if (/1152\s*[x×]\s*768/i.test(haystack) && /cara-3/i.test(haystack)) {
      return { videoWidth: 720, videoHeight: 480 };
    }
    return null;
  }

  return preferred;
}

export function formatAnamClientError(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const cause = readErrorCause(error) || null;

  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const statusCode =
    "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : null;

  const message = error.message.trim();

  if (isAnamConcurrentSessionError(error)) {
    return "Anam: лимит одновременных сессий. Закройте другие вкладки Talk или подождите 1–2 минуты и попробуйте снова.";
  }

  if (isAnamVideoDimensionError(error)) {
    return "Anam: неверный размер видео для аватара. Повторяем с поддерживаемым разрешением…";
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
