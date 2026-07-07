import type {
  NullxesChatCompletionRequest,
  NullxesHealthStatus,
  NullxesModelInfo,
  NullxesSdkConfig,
} from "./types";

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export class NullxesSdkClient {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;

  constructor(config: NullxesSdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "nullxes-brain-v1";
  }

  private headers(extra?: HeadersInit): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "X-Nullxes-SDK-Version": "0.1.0",
      ...extra,
    };
  }

  async chatCompletions(
    request: NullxesChatCompletionRequest,
  ): Promise<Response> {
    return fetch(joinUrl(this.baseUrl, "chat/completions"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
      }),
    });
  }

  async listModels(): Promise<NullxesModelInfo[]> {
    const response = await fetch(joinUrl(this.baseUrl, "models"), {
      method: "GET",
      headers: this.headers(),
    });

    if (!response.ok) {
      return [
        {
          id: this.defaultModel,
          label: this.defaultModel,
        },
      ];
    }

    const payload = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };

    const models = payload.data
      ?.map((entry) => entry.id?.trim())
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ id, label: id }));

    if (models?.length) {
      return models;
    }

    return [{ id: this.defaultModel, label: this.defaultModel }];
  }

  async healthCheck(): Promise<NullxesHealthStatus> {
    const startedAt = Date.now();

    try {
      const response = await fetch(joinUrl(this.baseUrl, "models"), {
        method: "GET",
        headers: this.headers(),
      });

      return {
        healthy: response.ok,
        latencyMs: Date.now() - startedAt,
        detail: response.ok ? "reachable" : `HTTP ${response.status}`,
      };
    } catch (error: unknown) {
      return {
        healthy: false,
        latencyMs: Date.now() - startedAt,
        detail:
          error instanceof Error ? error.message : "NULLXES API unreachable",
      };
    }
  }
}
