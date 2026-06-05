export function apiJson<T>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function apiError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  return apiJson(
    {
      error: message,
      ...extra,
    },
    { status },
  );
}
