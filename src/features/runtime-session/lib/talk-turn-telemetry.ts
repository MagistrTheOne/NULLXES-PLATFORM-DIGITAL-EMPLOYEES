import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import type { TalkTurnFlags, TalkTurnSpanKey, TalkTurnSpans } from "../types/talk-turn-metrics";

export type TalkTurnTelemetryInput = {
  employeeId: string;
  sessionId?: string;
  voiceMode: TalkVoiceMode;
  scenarioSessionId?: string;
};

/**
 * Per-turn client timings for Talk voice pipeline (real performance.now() only).
 * Fire-and-forget POST to /api/talk/telemetry when speaking starts.
 */
export function createTalkTurnTelemetry(
  input: TalkTurnTelemetryInput,
): TalkTurnTelemetry {
  return new TalkTurnTelemetry(input);
}

export class TalkTurnTelemetry {
  readonly turnId = crypto.randomUUID();
  private readonly input: TalkTurnTelemetryInput;
  private speechDetectedAt: number | null = null;
  private brainRequestAt: number | null = null;
  private firstChunkAt: number | null = null;
  private speakingAt: number | null = null;
  private flushed = false;
  private serverSpans: TalkTurnSpans = {};
  private flags: TalkTurnFlags = {};

  constructor(input: TalkTurnTelemetryInput) {
    this.input = input;
  }

  mergeServerPerf(input: {
    spans?: Partial<Record<TalkTurnSpanKey, number>>;
    flags?: TalkTurnFlags;
  }): void {
    if (input.spans) {
      for (const [key, value] of Object.entries(input.spans) as Array<
        [TalkTurnSpanKey, number]
      >) {
        if (typeof value === "number" && Number.isFinite(value)) {
          this.serverSpans[key] = Math.round(value);
        }
      }
    }

    if (input.flags) {
      this.flags = { ...this.flags, ...input.flags };
    }
  }

  markSpeechDetected(): void {
    if (this.speechDetectedAt === null) {
      this.speechDetectedAt = performance.now();
    }
  }

  markBrainRequestStart(): void {
    this.brainRequestAt = performance.now();
  }

  markFirstBrainChunk(): void {
    if (this.firstChunkAt === null) {
      this.firstChunkAt = performance.now();
    }
  }

  markSpeaking(): void {
    if (this.speakingAt !== null) {
      return;
    }
    this.speakingAt = performance.now();
    void this.flush();
  }

  private buildClientSpans(): TalkTurnSpans {
    const spans: TalkTurnSpans = { ...this.serverSpans };

    if (this.speechDetectedAt !== null && this.brainRequestAt !== null) {
      spans.debounce = Math.round(this.brainRequestAt - this.speechDetectedAt);
    }

    if (this.brainRequestAt !== null && this.firstChunkAt !== null) {
      spans.brain_rtt = Math.round(this.firstChunkAt - this.brainRequestAt);
    }

    if (this.speechDetectedAt !== null && this.speakingAt !== null) {
      spans.e2e = Math.round(this.speakingAt - this.speechDetectedAt);
    }

    return spans;
  }

  private async flush(): Promise<void> {
    if (this.flushed) {
      return;
    }
    this.flushed = true;

    const spans = this.buildClientSpans();
    if (Object.keys(spans).length === 0) {
      return;
    }

    try {
      await fetch("/api/talk/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnId: this.turnId,
          employeeId: this.input.employeeId,
          sessionId: this.input.sessionId,
          voiceMode: this.input.voiceMode,
          scenarioSessionId: this.input.scenarioSessionId,
          spans,
          flags: this.flags,
        }),
        keepalive: true,
      });
    } catch {
      // Telemetry must never affect the Talk session.
    }
  }
}
