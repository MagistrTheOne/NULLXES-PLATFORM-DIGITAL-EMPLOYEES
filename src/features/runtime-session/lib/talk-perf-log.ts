import { recordTalkSla, type TalkSlaSpan } from "./talk-sla";

export function isTalkPerfLogEnabled(): boolean {
  return process.env.TALK_PERF_LOG === "1";
}

function isTalkSlaSpan(event: string): event is TalkSlaSpan {
  return (
    event === "talk.brain.build" ||
    event === "talk.brain.rag" ||
    event === "talk.brain.ttfb" ||
    event === "talk.brain.tool_loop" ||
    event === "talk.session.start"
  );
}

export function logTalkPerf(
  event: string,
  data: Record<string, string | number | boolean | undefined>,
): void {
  const durationMs =
    typeof data.duration_ms === "number" ? data.duration_ms : undefined;

  if (durationMs !== undefined && isTalkSlaSpan(event)) {
    const { duration_ms: _duration, ...tags } = data;
    recordTalkSla({
      span: event,
      durationMs,
      tags,
    });
  }

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
