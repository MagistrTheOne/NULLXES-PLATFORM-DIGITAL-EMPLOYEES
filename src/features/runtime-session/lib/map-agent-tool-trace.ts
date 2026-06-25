const TOOL_TRACE_KEYS: Record<string, string> = {
  search_knowledge: "searchingKnowledge",
  search_web: "searchingWeb",
  list_workspace_connectors: "checkingConnectors",
  list_workforce_peers: "checkingWorkforce",
  create_follow_up_task: "schedulingTask",
  request_handoff: "handingOff",
  draft_email: "draftingEmail",
};

export function resolveAgentToolTraceKey(toolName: string): string {
  return TOOL_TRACE_KEYS[toolName] ?? "working";
}
