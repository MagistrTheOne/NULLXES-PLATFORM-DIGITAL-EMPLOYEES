import {
  getNullxesBrainApiBaseUrl,
  getNullxesBrainApiKey,
  getNullxesBrainModel,
} from "@/shared/config/provider-env";

const DEFAULT_NULLXES_API_BASE_URL = "https://api.nullxes.com/v1";

export function getNullxesApiBaseUrl(): string | undefined {
  const platformUrl = process.env.NULLXES_API_BASE_URL?.trim();
  if (platformUrl) {
    return platformUrl.replace(/\/$/, "");
  }

  const legacyUrl = getNullxesBrainApiBaseUrl();
  if (legacyUrl) {
    return legacyUrl.replace(/\/$/, "");
  }

  return undefined;
}

export function getNullxesApiKey(): string | undefined {
  const platformKey = process.env.NULLXES_API_KEY?.trim();
  if (platformKey) {
    return platformKey;
  }

  return getNullxesBrainApiKey();
}

export function getNullxesApiDefaultModel(): string {
  return (
    process.env.NULLXES_API_DEFAULT_MODEL?.trim() ||
    process.env.NULLXES_BRAIN_MODEL?.trim() ||
    getNullxesBrainModel()
  );
}

export function hasNullxesApiCredentials(): boolean {
  return Boolean(getNullxesApiBaseUrl() && getNullxesApiKey());
}

export function resolveNullxesSdkConfig(): {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
} | null {
  const baseUrl = getNullxesApiBaseUrl();
  const apiKey = getNullxesApiKey();

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    defaultModel: getNullxesApiDefaultModel(),
  };
}

export function getNullxesSdkDocsBaseUrl(): string {
  return process.env.NULLXES_API_DOCS_URL?.trim() || DEFAULT_NULLXES_API_BASE_URL;
}
