export type NullxesSdkConfig = {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
};

export type NullxesChatRole = "system" | "user" | "assistant" | "tool";

export type NullxesToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type NullxesChatMessage = {
  role: NullxesChatRole;
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: NullxesToolCall[];
};

export type NullxesChatCompletionRequest = {
  model: string;
  messages: NullxesChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: unknown[];
  response_format?: { type: "json_object" };
};

export type NullxesModelInfo = {
  id: string;
  label?: string;
};

export type NullxesHealthStatus = {
  healthy: boolean;
  latencyMs?: number;
  detail?: string;
};
