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
): AgentToolDefinition[] | undefined {
  const tools: AgentToolDefinition[] = [];

  if (shouldRunTalkWebSearch(lastUserMessage)) {
    tools.push(SEARCH_WEB_TOOL);
  }

  if (shouldRunTalkToolLoop(lastUserMessage)) {
    tools.push(...TALK_ACTION_TOOLS);
  }

  return tools.length > 0 ? tools : undefined;
}
