import type { TalkPipelineMessage } from "../actions/talk-voice-pipeline";
import type { TalkTurnFlags, TalkTurnSpanKey } from "../types/talk-turn-metrics";
import { resolveAgentToolTraceKey } from "./map-agent-tool-trace";

export async function streamTalkBrainReply(input: {
  employeeId: string;
  sessionId?: string;
  turnId?: string;
  scenarioSessionId?: string;
  messages: TalkPipelineMessage[];
  onChunk?: (chunk: string) => void | Promise<void>;
  onToolTrace?: (traceKey: string | null) => void | Promise<void>;
  onBrainMeta?: (meta: { modelLabel: string }) => void | Promise<void>;
  onServerPerf?: (payload: {
    spans?: Partial<Record<TalkTurnSpanKey, number>>;
    flags?: TalkTurnFlags;
  }) => void | Promise<void>;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await fetch("/api/talk/brain-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: input.employeeId,
      sessionId: input.sessionId,
      turnId: input.turnId,
      scenarioSessionId: input.scenarioSessionId,
      messages: input.messages,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { error?: string };
      detail = payload.error ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(`Brain stream request failed (${response.status}): ${detail}`);
  }

  if (!response.body) {
    throw new Error("Brain stream returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let replyText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const payload = JSON.parse(trimmed) as {
        type?: string;
        content?: string;
        error?: string;
        tool?: string;
        phase?: "start" | "done";
        modelLabel?: string;
        spans?: Partial<Record<TalkTurnSpanKey, number>>;
        flags?: TalkTurnFlags;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (payload.type === "perf") {
        await input.onServerPerf?.({
          spans: payload.spans,
          flags: payload.flags,
        });
        continue;
      }

      if (payload.type === "meta" && payload.modelLabel) {
        await input.onBrainMeta?.({ modelLabel: payload.modelLabel });
        continue;
      }

      if (payload.type === "tool" && payload.tool && payload.phase) {
        if (payload.phase === "start") {
          await input.onToolTrace?.(resolveAgentToolTraceKey(payload.tool));
        } else {
          await input.onToolTrace?.(null);
        }
        continue;
      }

      if (payload.type === "content" && payload.content) {
        replyText += payload.content;
        await input.onChunk?.(payload.content);
        continue;
      }

      if (payload.content) {
        replyText += payload.content;
        await input.onChunk?.(payload.content);
      }
    }
  }

  await input.onToolTrace?.(null);

  const trimmed = replyText.trim();
  if (!trimmed) {
    throw new Error("Brain stream returned an empty response");
  }

  return trimmed;
}
