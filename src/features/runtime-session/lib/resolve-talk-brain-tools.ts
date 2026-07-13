import {
  SEARCH_WEB_TOOL,
  TALK_ACTION_TOOLS,
  type AgentToolDefinition,
} from "@/features/agent-tools/lib/tool-definitions";
import {
  shouldRunChatToolLoop,
  shouldRunTalkToolLoop,
  shouldRunTalkWebSearch,
} from "@/features/runtime-session/lib/should-run-talk-tool-loop";

export type TalkBrainChannel = "chat" | "voice";

/** Always offered when enabled — agents must ground status in live DB, not invent. */
const TALK_READ_TOOL_SLUGS = new Set([
  "list_missions",
  "list_tasks",
  "list_workforce_peers",
]);

function collectEnabledTools(
  enabled: Set<string>,
  mode: "read" | "write",
): AgentToolDefinition[] {
  return TALK_ACTION_TOOLS.filter((tool) => {
    const name = tool.function.name;
    if (!enabled.has(name)) {
      return false;
    }
    const isRead = TALK_READ_TOOL_SLUGS.has(name);
    return mode === "read" ? isRead : !isRead;
  });
}

function resolveBrainToolsForIntent(input: {
  lastUserMessage: string;
  enabledToolSlugs: string[];
  shouldEnableActionTools: (message: string) => boolean;
}): AgentToolDefinition[] | undefined {
  const enabled = new Set(input.enabledToolSlugs);
  const tools: AgentToolDefinition[] = [];

  // Read tools stay attached every turn so mission/task questions cannot be faked.
  tools.push(...collectEnabledTools(enabled, "read"));

  if (enabled.has("search_web") && shouldRunTalkWebSearch(input.lastUserMessage)) {
    tools.push(SEARCH_WEB_TOOL);
  }

  if (input.shouldEnableActionTools(input.lastUserMessage)) {
    tools.push(...collectEnabledTools(enabled, "write"));
  }

  return tools.length > 0 ? tools : undefined;
}

/** Voice/mic: write tools only when the utterance needs them — keeps latency low. */
export function resolveTalkBrainTools(
  lastUserMessage: string,
  enabledToolSlugs: string[] = [],
): AgentToolDefinition[] | undefined {
  return resolveBrainToolsForIntent({
    lastUserMessage,
    enabledToolSlugs,
    shouldEnableActionTools: shouldRunTalkToolLoop,
  });
}

/** Text chat: broader mission/status intent routing for write tools. */
export function resolveChatBrainTools(
  lastUserMessage: string,
  enabledToolSlugs: string[] = [],
): AgentToolDefinition[] | undefined {
  return resolveBrainToolsForIntent({
    lastUserMessage,
    enabledToolSlugs,
    shouldEnableActionTools: shouldRunChatToolLoop,
  });
}

export function resolveBrainToolsForChannel(
  channel: TalkBrainChannel,
  lastUserMessage: string,
  enabledToolSlugs: string[] = [],
): AgentToolDefinition[] | undefined {
  return channel === "chat"
    ? resolveChatBrainTools(lastUserMessage, enabledToolSlugs)
    : resolveTalkBrainTools(lastUserMessage, enabledToolSlugs);
}
