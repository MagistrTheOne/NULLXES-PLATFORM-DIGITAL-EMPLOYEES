const SEARCH_KNOWLEDGE_TOOL = {
  type: "function" as const,
  function: {
    name: "search_knowledge",
    description:
      "Search the digital employee knowledge base for relevant documents and facts.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query describing what information is needed.",
        },
      },
      required: ["query"],
    },
  },
};

export const SEARCH_WEB_TOOL = {
  type: "function" as const,
  function: {
    name: "search_web",
    description:
      "Search the public web for up-to-date information, news, prices, or facts not in the knowledge base. Use for current events and live data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Specific web search query.",
        },
      },
      required: ["query"],
    },
  },
};

export const TALK_ACTION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_follow_up_task",
      description:
        "Create a follow-up task for the digital employee to complete later.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short task title." },
          description: {
            type: "string",
            description: "Detailed task instructions.",
          },
          dueInHours: {
            type: "number",
            description: "When the follow-up should run, in hours from now.",
          },
        },
        required: ["title", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_missions",
      description:
        "List missions for this digital employee with live status, outbound sends (who, what, why), handoffs, and timeline.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum missions to return (default 5, max 10).",
          },
          missionId: {
            type: "string",
            description: "Optional mission UUID for a detailed single-mission report.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancel_mission",
      description:
        "Cancel an in-progress or awaiting-approval mission. Use when the operator asks to stop or interrupt a mission.",
      parameters: {
        type: "object",
        properties: {
          missionId: { type: "string", description: "Mission UUID from list_missions." },
          reason: { type: "string", description: "Why the mission was cancelled." },
        },
        required: ["missionId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "restart_mission",
      description:
        "Restart a cancelled or failed mission with optional updated brief, goal, or skills.",
      parameters: {
        type: "object",
        properties: {
          missionId: { type: "string", description: "Mission UUID from list_missions." },
          brief: { type: "string", description: "Updated mission brief." },
          goal: { type: "string", description: "Updated mission goal." },
          skills: { type: "string", description: "Updated skills (comma-separated)." },
          reason: { type: "string", description: "Why the mission is being restarted." },
        },
        required: ["missionId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_workforce_peers",
      description:
        "List other digital employees in the organization for routing or handoff.",
      parameters: {
        type: "object",
        properties: {
          roleQuery: {
            type: "string",
            description:
              "Optional filter by employee name or role (e.g. sales, legal).",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "request_handoff",
      description:
        "Hand off work to another digital employee in the organization.",
      parameters: {
        type: "object",
        properties: {
          toEmployeeId: {
            type: "string",
            description: "Target digital employee UUID when known.",
          },
          toEmployeeName: {
            type: "string",
            description:
              "Target employee name when UUID is unknown. Use list_workforce_peers first if unsure.",
          },
          reason: { type: "string", description: "Why the handoff is needed." },
          context: {
            type: "string",
            description: "Context for the receiving employee.",
          },
        },
        required: ["reason", "context"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "draft_email",
      description:
        "Draft a professional email for human review. Does not send email.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email or name." },
          subject: { type: "string", description: "Email subject line." },
          body: { type: "string", description: "Email body content." },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
];

export const AGENT_TOOL_DEFINITIONS = [
  SEARCH_KNOWLEDGE_TOOL,
  SEARCH_WEB_TOOL,
  ...TALK_ACTION_TOOLS,
];

export const TALK_AGENT_TOOL_DEFINITIONS = [
  SEARCH_WEB_TOOL,
  ...TALK_ACTION_TOOLS,
];

export type AgentToolDefinition = (typeof AGENT_TOOL_DEFINITIONS)[number];

export type AgentToolExecutionContext = {
  organizationId: string;
  employeeId: string;
  sessionId?: string;
};

export type AgentToolExecutionResult = {
  content: string;
  taskCreated?: boolean;
  taskId?: string;
  requiresApproval?: boolean;
};
