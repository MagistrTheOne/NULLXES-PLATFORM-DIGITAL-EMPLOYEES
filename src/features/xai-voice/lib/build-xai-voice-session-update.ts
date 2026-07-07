import { TALK_AGENT_TOOL_DEFINITIONS } from "@/features/agent-tools/lib/tool-definitions";
import type { XaiVoiceTool } from "@/features/xai-voice/lib/to-xai-voice-tools";
import { toXaiVoiceTools } from "@/features/xai-voice/lib/to-xai-voice-tools";

export type XaiVoiceSessionUpdate = {
  instructions?: string;
  reasoning?: { effort: "none" };
  tools?: XaiVoiceTool[];
  turn_detection: {
    type: "server_vad";
    silence_duration_ms?: number;
    prefix_padding_ms?: number;
  };
  audio?: {
    input: {
      format: { type: "audio/pcm"; rate: number };
    };
    output: {
      format: { type: "audio/pcm"; rate: number };
    };
  };
};

export function buildXaiVoiceSessionUpdate(input: {
  enabledToolSlugs: string[];
  bindConsoleAgent: boolean;
  instructions?: string | null;
  sampleRate?: number;
}): XaiVoiceSessionUpdate {
  const enabled = new Set(input.enabledToolSlugs);
  const tools = toXaiVoiceTools(
    TALK_AGENT_TOOL_DEFINITIONS.filter((tool) =>
      enabled.has(tool.function.name),
    ),
  );

  const sampleRate = input.sampleRate ?? 24000;
  const session: XaiVoiceSessionUpdate = {
    reasoning: { effort: "none" },
    turn_detection: {
      type: "server_vad",
      silence_duration_ms: 400,
      prefix_padding_ms: 200,
    },
    audio: {
      input: {
        format: { type: "audio/pcm", rate: sampleRate },
      },
      output: {
        format: { type: "audio/pcm", rate: sampleRate },
      },
    },
  };

  if (tools.length > 0) {
    session.tools = tools;
  }

  if (!input.bindConsoleAgent && input.instructions?.trim()) {
    session.instructions = input.instructions.trim();
  }

  return session;
}
