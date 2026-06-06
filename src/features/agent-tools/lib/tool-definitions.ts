export const AGENT_TOOL_DEFINITIONS = [
  {
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
  },
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
      name: "request_handoff",
      description:
        "Hand off work to another digital employee in the organization.",
      parameters: {
        type: "object",
        properties: {
          toEmployeeId: {
            type: "string",
            description: "Target digital employee UUID.",
          },
          reason: { type: "string", description: "Why the handoff is needed." },
          context: {
            type: "string",
            description: "Context for the receiving employee.",
          },
        },
        required: ["toEmployeeId", "reason", "context"],
      },
    },
  },
];

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
