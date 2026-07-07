export type OpenAiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type BrainChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: OpenAiToolCall[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type BrainChatToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type BrainChatRequest = {
  model: string;
  messages: BrainChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: BrainChatToolDefinition[];
  stream?: boolean;
  responseFormat?: { type: "json_object" };
};

export type OpenAiCompletionPayload = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
    finish_reason?: string | null;
  }>;
};
