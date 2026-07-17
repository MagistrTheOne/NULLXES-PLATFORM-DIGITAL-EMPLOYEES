const TOOL_TRACE_KEYS: Record<string, string> = {
  search_knowledge: "searchingKnowledge",
  search_web: "searchingWeb",
  generate_image: "generatingImage",
  analyze_image: "analyzingImage",
  list_workspace_connectors: "checkingConnectors",
  list_workforce_peers: "checkingWorkforce",
  list_missions: "checkingMissions",
  cancel_mission: "updatingMission",
  restart_mission: "updatingMission",
  create_follow_up_task: "schedulingTask",
  request_handoff: "handingOff",
  draft_email: "draftingEmail",
};

export function resolveAgentToolTraceKey(toolName: string): string {
  return TOOL_TRACE_KEYS[toolName] ?? "working";
}
