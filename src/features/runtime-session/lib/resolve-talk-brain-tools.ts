import {
  SEARCH_WEB_TOOL,
  TALK_ACTION_TOOLS,
  type AgentToolDefinition,
} from "@/features/agent-tools/lib/tool-definitions";
import {
  shouldRunTalkToolLoop,
  shouldRunTalkWebSearch,
} from "@/features/runtime-session/lib/should-run-talk-tool-loop";

/** Talk mode: only enable tools when the user message needs them — keeps latency low. */
export function resolveTalkBrainTools(
  lastUserMessage: string,
  enabledToolSlugs: string[] = [],
): AgentToolDefinition[] | undefined {
  const enabled = new Set(enabledToolSlugs);
  const tools: AgentToolDefinition[] = [];

  if (enabled.has("search_web") && shouldRunTalkWebSearch(lastUserMessage)) {
    tools.push(SEARCH_WEB_TOOL);
  }

  if (shouldRunTalkToolLoop(lastUserMessage)) {
    for (const tool of TALK_ACTION_TOOLS) {
      if (enabled.has(tool.function.name)) {
        tools.push(tool);
      }
    }
  }

  return tools.length > 0 ? tools : undefined;
}
