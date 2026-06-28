export function apiJson<T>(
  data: T,
  init?: { status?: number; headers?: Record<string, string>; requestId?: string },
): Response {
  const body =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? {
          ...(data as Record<string, unknown>),
          ...(init?.requestId ? { requestId: init.requestId } : {}),
        }
      : data;

  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.requestId ? { "X-Request-Id": init.requestId } : {}),
      ...init?.headers,
    },
  });
}

export function apiError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  const requestId =
    typeof extra?.requestId === "string" ? extra.requestId : undefined;

  return apiJson(
    {
      error: message,
      ...extra,
    },
    { status, requestId },
  );
}

export function apiSuccess<T>(
  data: T,
  init?: { status?: number; requestId?: string },
): Response {
  return apiJson({ data }, init);
}
