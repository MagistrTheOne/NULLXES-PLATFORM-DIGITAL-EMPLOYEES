import * as Sentry from "@sentry/nextjs";
import { logServerEvent } from "@/shared/lib/server-log";

export type TalkSlaSpan =
  | "talk.brain.build"
  | "talk.brain.rag"
  | "talk.brain.ttfb"
  | "talk.brain.tool_loop"
  | "talk.session.start"
  | "talk.turn.debounce"
  | "talk.turn.brain_rtt"
  | "talk.turn.e2e";

type TalkSlaThreshold = {
  warnMs: number;
  breachMs: number;
};

/** Single source of truth for Talk latency SLA thresholds (milliseconds). */
export const TALK_SLA_THRESHOLDS: Record<TalkSlaSpan, TalkSlaThreshold> = {
  "talk.brain.build": { warnMs: 300, breachMs: 500 },
  "talk.brain.rag": { warnMs: 250, breachMs: 400 },
  "talk.brain.ttfb": { warnMs: 800, breachMs: 1500 },
  "talk.brain.tool_loop": { warnMs: 1000, breachMs: 3000 },
  "talk.session.start": { warnMs: 2000, breachMs: 4000 },
  "talk.turn.debounce": { warnMs: 120, breachMs: 200 },
  "talk.turn.brain_rtt": { warnMs: 1200, breachMs: 2500 },
  "talk.turn.e2e": { warnMs: 2000, breachMs: 3500 },
};

export type TalkSlaMode = "off" | "observe" | "enforce";

export function getTalkSlaMode(): TalkSlaMode {
  const configured = process.env.TALK_SLA_MODE?.trim().toLowerCase();
  if (configured === "off" || configured === "observe" || configured === "enforce") {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "observe" : "off";
}

export type TalkSlaSeverity = "ok" | "warn" | "breach";

export function classifyTalkSla(
  span: TalkSlaSpan,
  durationMs: number,
): TalkSlaSeverity {
  const threshold = TALK_SLA_THRESHOLDS[span];
  if (durationMs >= threshold.breachMs) {
    return "breach";
  }
  if (durationMs >= threshold.warnMs) {
    return "warn";
  }
  return "ok";
}

function shouldSampleHealthySpan(): boolean {
  return Math.random() < 0.01;
}

/**
 * Record a measured span against SLA thresholds.
 * Never uses mock data — `durationMs` must come from performance.now() deltas.
 */
export function recordTalkSla(input: {
  span: TalkSlaSpan;
  durationMs: number;
  tags?: Record<string, string | number | boolean | undefined>;
}): TalkSlaSeverity {
  const mode = getTalkSlaMode();
  if (mode === "off") {
    return "ok";
  }

  const duration_ms = Math.round(input.durationMs);
  const severity = classifyTalkSla(input.span, duration_ms);
  const tags = input.tags ?? {};

  if (severity === "breach") {
    if (mode === "enforce") {
      logServerEvent(
        "talk.sla.breach",
        {
          span: input.span,
          duration_ms,
          warn_ms: TALK_SLA_THRESHOLDS[input.span].warnMs,
          breach_ms: TALK_SLA_THRESHOLDS[input.span].breachMs,
          ...tags,
        },
        "warn",
      );
      Sentry.captureMessage(`Talk SLA breach: ${input.span}`, {
        level: "warning",
        extra: { duration_ms, ...tags },
        tags: { talk_sla_span: input.span },
      });
    } else {
      logServerEvent("talk.sla.observe_breach", {
        span: input.span,
        duration_ms,
        ...tags,
      });
    }
    return "breach";
  }

  if (severity === "warn" && mode === "enforce") {
    logServerEvent("talk.sla.warn", {
      span: input.span,
      duration_ms,
      ...tags,
    });
    return "warn";
  }

  if (mode === "observe" && shouldSampleHealthySpan()) {
    logServerEvent("talk.sla.sample", {
      span: input.span,
      duration_ms,
      severity,
      ...tags,
    });
  }

  return severity;
}
