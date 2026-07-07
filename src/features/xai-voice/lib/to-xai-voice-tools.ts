import type { AgentToolDefinition } from "@/features/agent-tools/lib/tool-definitions";

export type XaiVoiceTool =
  | { type: "web_search" }
  | {
      type: "function";
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };

const XAI_VOICE_PLATFORM_TOOL_NAMES = new Set([
  "list_missions",
  "cancel_mission",
  "restart_mission",
  "list_workforce_peers",
  "request_handoff",
  "search_knowledge",
  "create_follow_up_task",
]);

export function toXaiVoiceTools(
  tools: AgentToolDefinition[],
): XaiVoiceTool[] {
  const xaiTools: XaiVoiceTool[] = [];
  const added = new Set<string>();

  for (const tool of tools) {
    const name = tool.function.name;
    if (!XAI_VOICE_PLATFORM_TOOL_NAMES.has(name) || added.has(name)) {
      continue;
    }

    added.add(name);
    xaiTools.push({
      type: "function",
      name,
      description: tool.function.description,
      parameters: tool.function.parameters as Record<string, unknown>,
    });
  }

  const hasWebSearch = tools.some((tool) => tool.function.name === "search_web");
  if (hasWebSearch) {
    xaiTools.push({ type: "web_search" });
  }

  return xaiTools;
}
