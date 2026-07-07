import {
  getAnamApiKey,
  getOpenAiApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
import {
  getAnthropicApiKey,
  getGoogleApiKey,
} from "@/shared/config/provider-env";
import { hasNullxesApiCredentials } from "@/shared/nullxes-sdk";
import type { SystemStatusItem } from "../types";

function configured(label: string, isConfigured: boolean): SystemStatusItem {
  return {
    label,
    status: isConfigured ? "operational" : "unavailable",
    detail: isConfigured ? "Configured" : "Not configured",
  };
}

export function getSystemStatus(): SystemStatusItem[] {
  const streamReady = Boolean(getStreamApiKey() && getStreamSecretKey());
  const openAiReady = Boolean(getOpenAiApiKey());
  const anthropicReady = Boolean(getAnthropicApiKey());
  const googleReady = Boolean(getGoogleApiKey());
  const nullxesReady = hasNullxesApiCredentials();
  const anamReady = Boolean(getAnamApiKey());
  const anyBrainReady =
    openAiReady || anthropicReady || googleReady || nullxesReady;

  return [
    {
      label: "Database",
      status: "operational",
      detail: "Connected",
    },
    configured("OpenAI", openAiReady),
    configured("Anthropic", anthropicReady),
    configured("Google Gemini", googleReady),
    configured("NULLXES Brain API", nullxesReady),
    configured("Voice Services", streamReady),
    configured("Avatar Services", anamReady),
    {
      label: "Knowledge Services",
      status: anyBrainReady ? "operational" : "degraded",
      detail: anyBrainReady ? "Ready for indexing" : "Requires AI provider",
    },
    {
      label: "Storage",
      status: "operational",
      detail: "Neon PostgreSQL",
    },
  ];
}
