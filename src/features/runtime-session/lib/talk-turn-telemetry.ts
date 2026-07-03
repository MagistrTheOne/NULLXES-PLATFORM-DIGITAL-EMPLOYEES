import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";

export type TalkTurnSpanName = "debounce" | "brain_rtt" | "e2e";

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

class TalkTurnTelemetry {
  private readonly turnId = crypto.randomUUID();
  private speechDetectedAt: number | null = null;
  private brainRequestAt: number | null = null;
  private firstChunkAt: number | null = null;
  private speakingAt: number | null = null;
  private flushed = false;

  constructor(private readonly input: TalkTurnTelemetryInput) {}

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

  private buildSpans(): Partial<Record<TalkTurnSpanName, number>> {
    const spans: Partial<Record<TalkTurnSpanName, number>> = {};

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

    const spans = this.buildSpans();
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
        }),
        keepalive: true,
      });
    } catch {
      // Telemetry must never affect the Talk session.
    }
  }
}
