import { createClient, type AnamClient } from "@anam-ai/js-sdk";
import { suppressAnamClientMetricsFetch } from "./suppress-anam-client-metrics";

suppressAnamClientMetricsFetch();

/**
 * Browser telemetry hits api.anam.ai/v1/metrics/client without CORS headers for
 * custom app origins — disable it; Talk does not depend on client metrics.
 */
export function createAnamTalkClient(sessionToken: string): AnamClient {
  suppressAnamClientMetricsFetch();

  return createClient(sessionToken, {
    metrics: {
      disableClientMetrics: true,
    },
  });
}
