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

function collectEnabledActionTools(
  enabled: Set<string>,
): AgentToolDefinition[] {
  return TALK_ACTION_TOOLS.filter((tool) => enabled.has(tool.function.name));
}

function resolveBrainToolsForIntent(input: {
  lastUserMessage: string;
  enabledToolSlugs: string[];
  shouldEnableActionTools: (message: string) => boolean;
}): AgentToolDefinition[] | undefined {
  const enabled = new Set(input.enabledToolSlugs);
  const tools: AgentToolDefinition[] = [];

  if (enabled.has("search_web") && shouldRunTalkWebSearch(input.lastUserMessage)) {
    tools.push(SEARCH_WEB_TOOL);
  }

  if (input.shouldEnableActionTools(input.lastUserMessage)) {
    tools.push(...collectEnabledActionTools(enabled));
  }

  return tools.length > 0 ? tools : undefined;
}

/** Voice/mic: enable tools only when the utterance needs them — keeps latency low. */
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

/** Text chat: broader mission/status intent routing for grounded platform answers. */
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
