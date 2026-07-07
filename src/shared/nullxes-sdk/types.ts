export type NullxesSdkConfig = {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
};

export type NullxesChatRole = "system" | "user" | "assistant" | "tool";

export type NullxesChatMessage = {
  role: NullxesChatRole;
  content: string;
  tool_call_id?: string;
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
