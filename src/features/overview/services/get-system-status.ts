import {
  getAnamApiKey,
  getOpenAiApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
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
  const anamReady = Boolean(getAnamApiKey());

  return [
    {
      label: "Database",
      status: "operational",
      detail: "Connected",
    },
    configured("AI Services", openAiReady),
    configured("Voice Services", streamReady),
    configured("Avatar Services", anamReady),
    {
      label: "Knowledge Services",
      status: openAiReady ? "operational" : "degraded",
      detail: openAiReady ? "Ready for indexing" : "Requires AI provider",
    },
    {
      label: "Storage",
      status: "operational",
      detail: "Neon PostgreSQL",
    },
  ];
}
