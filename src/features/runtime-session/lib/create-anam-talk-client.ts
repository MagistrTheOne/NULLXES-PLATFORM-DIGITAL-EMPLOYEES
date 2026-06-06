import { createClient, type AnamClient } from "@anam-ai/js-sdk";

/**
 * Browser telemetry hits api.anam.ai/v1/metrics/client without CORS headers for
 * custom app origins — disable it; Talk does not depend on client metrics.
 */
export function createAnamTalkClient(sessionToken: string): AnamClient {
  return createClient(sessionToken, {
    metrics: {
      disableClientMetrics: true,
    },
  });
}
