export function isTalkPerfLogEnabled(): boolean {
  return (
    process.env.TALK_PERF_LOG === "1" ||
    (process.env.NODE_ENV === "development" &&
      process.env.TALK_PERF_LOG !== "0")
  );
}

export function logTalkPerf(
  event: string,
  data: Record<string, string | number | boolean | undefined>,
): void {
  if (!isTalkPerfLogEnabled()) {
    return;
  }

  console.info(
    JSON.stringify({
      type: "talk_perf",
      event,
      ...data,
      at: new Date().toISOString(),
    }),
  );
}

export async function measureTalkPerf<T>(
  event: string,
  run: () => Promise<T>,
  extra?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await run();
  } finally {
    logTalkPerf(event, {
      ...extra,
      duration_ms: Math.round(performance.now() - startedAt),
    });
  }
}
