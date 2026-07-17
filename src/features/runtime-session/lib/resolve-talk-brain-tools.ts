import {
  ANALYZE_IMAGE_TOOL,
  GENERATE_IMAGE_TOOL,
  SEARCH_KNOWLEDGE_TOOL,
  SEARCH_WEB_TOOL,
  TALK_ACTION_TOOLS,
  type AgentToolDefinition,
} from "@/features/agent-tools/lib/tool-definitions";
import {
  shouldRunChatToolLoop,
  shouldRunTalkImageGen,
  shouldRunTalkToolLoop,
  shouldRunTalkVision,
  shouldRunTalkWebSearch,
} from "@/features/runtime-session/lib/should-run-talk-tool-loop";

export type TalkBrainChannel = "chat" | "voice";

/** Always offered when enabled — agents must ground status in live DB, not invent. */
const TALK_READ_TOOL_SLUGS = new Set([
  "list_missions",
  "list_tasks",
  "list_workforce_peers",
  "search_knowledge",
]);

function collectEnabledTools(
  enabled: Set<string>,
  mode: "read" | "write",
): AgentToolDefinition[] {
  const catalog = [
    SEARCH_KNOWLEDGE_TOOL,
    ...TALK_ACTION_TOOLS,
  ] as AgentToolDefinition[];

  return catalog.filter((tool) => {
    const name = tool.function.name;
    if (!enabled.has(name)) {
      return false;
    }
    const isRead = TALK_READ_TOOL_SLUGS.has(name);
    return mode === "read" ? isRead : !isRead;
  });
}

function resolveBrainToolsForIntent(input: {
  channel: TalkBrainChannel;
  lastUserMessage: string;
  enabledToolSlugs: string[];
  shouldEnableActionTools: (message: string) => boolean;
}): AgentToolDefinition[] | undefined {
  const enabled = new Set(input.enabledToolSlugs);
  const tools: AgentToolDefinition[] = [];
  const isChat = input.channel === "chat";

  // Read tools stay attached every turn so mission/task/knowledge cannot be faked.
  tools.push(...collectEnabledTools(enabled, "read"));

  // Conversations (chat): always offer web search when enabled so the model
  // cannot refuse with "no realtime access". Voice keeps the latency heuristic.
  if (
    enabled.has("search_web") &&
    (isChat || shouldRunTalkWebSearch(input.lastUserMessage))
  ) {
    tools.push(SEARCH_WEB_TOOL);
  }

  if (
    enabled.has("generate_image") &&
    (isChat || shouldRunTalkImageGen(input.lastUserMessage))
  ) {
    tools.push(GENERATE_IMAGE_TOOL);
  }

  if (
    enabled.has("analyze_image") &&
    (isChat || shouldRunTalkVision(input.lastUserMessage))
  ) {
    tools.push(ANALYZE_IMAGE_TOOL);
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
    channel: "voice",
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
    channel: "chat",
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
