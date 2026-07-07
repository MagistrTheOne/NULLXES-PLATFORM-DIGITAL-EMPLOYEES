export { NullxesSdkClient } from "./client";
export {
  getNullxesApiBaseUrl,
  getNullxesApiDefaultModel,
  getNullxesApiKey,
  getNullxesSdkDocsBaseUrl,
  hasNullxesApiCredentials,
  resolveNullxesSdkConfig,
} from "./config";
export type {
  NullxesChatCompletionRequest,
  NullxesChatMessage,
  NullxesHealthStatus,
  NullxesModelInfo,
  NullxesSdkConfig,
} from "./types";

import { resolveNullxesSdkConfig } from "./config";
import { NullxesSdkClient } from "./client";

let cachedClient: NullxesSdkClient | null | undefined;

export function getNullxesSdkClient(): NullxesSdkClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const config = resolveNullxesSdkConfig();
  cachedClient = config ? new NullxesSdkClient(config) : null;
  return cachedClient;
}

export function resetNullxesSdkClientCache(): void {
  cachedClient = undefined;
}
