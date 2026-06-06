import type { TalkPipelineMessage } from "../actions/talk-voice-pipeline";

export async function streamTalkBrainReply(input: {
  employeeId: string;
  sessionId?: string;
  messages: TalkPipelineMessage[];
  onChunk?: (chunk: string) => void | Promise<void>;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await fetch("/api/talk/brain-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: input.employeeId,
      sessionId: input.sessionId,
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
        content?: string;
        error?: string;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (payload.content) {
        replyText += payload.content;
        await input.onChunk?.(payload.content);
      }
    }
  }

  const trimmed = replyText.trim();
  if (!trimmed) {
    throw new Error("Brain stream returned an empty response");
  }

  return trimmed;
}
