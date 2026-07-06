import type { BrainProvider } from "@/entities/digital-employee";
import {
  hasNullxesBrainCredentials,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";

/** Secondary provider when primary is unavailable — only openai ↔ nullxes. */
export function getBrainFailoverProvider(
  primary: BrainProvider,
): BrainProvider | null {
  if (primary === "nullxes" && hasOpenAiCredentials()) {
    return "openai";
  }

  if (primary === "openai" && hasNullxesBrainCredentials()) {
    return "nullxes";
  }

  return null;
}
