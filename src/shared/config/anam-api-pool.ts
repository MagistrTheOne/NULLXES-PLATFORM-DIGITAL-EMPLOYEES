const ANAM_API_BASE_URL_DEFAULT = "https://api.anam.ai/v1";

export const ANAM_API_KEY_SLOTS = [
  "ANAM_API_KEY",
  "ANAM_API_KEY_2",
  "ANAM_API_KEY_3",
  "ANAM_API_KEY_4",
  "ANAM_API_KEY_5",
  "ANAM_API_KEY_6",
  "ANAM_API_KEY_7",
  "ANAM_API_KEY_8",
  "ANAM_API_KEY_9",
  "ANAM_API_KEY_10",
  "ANAM_API_KEY_11",
] as const;

export type AnamApiKeySlot = (typeof ANAM_API_KEY_SLOTS)[number];

export type AnamApiKeyPoolEntry = {
  slot: AnamApiKeySlot;
  key: string;
  label: string;
};

let anamKeyRotationCursor = 0;

function getAnamApiBaseUrl(): string {
  return process.env.ANAM_API_BASE_URL?.trim() || ANAM_API_BASE_URL_DEFAULT;
}

export function getAnamApiKeyPool(): AnamApiKeyPoolEntry[] {
  const pool: AnamApiKeyPoolEntry[] = [];

  for (const [index, slot] of ANAM_API_KEY_SLOTS.entries()) {
    const key = process.env[slot]?.trim();
    if (!key) {
      continue;
    }

    pool.push({
      slot,
      key,
      label: `lab-${index + 1}`,
    });
  }

  return pool;
}

export function getAnamApiKeyBySlot(slot?: string | null): string | undefined {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    return undefined;
  }

  if (!slot) {
    return pool[0]?.key;
  }

  return pool.find((entry) => entry.slot === slot)?.key ?? pool[0]?.key;
}

export function getAnamApiKeysInRotationOrder(): AnamApiKeyPoolEntry[] {
  const pool = getAnamApiKeyPool();
  if (pool.length <= 1) {
    return pool;
  }

  const offset = anamKeyRotationCursor % pool.length;
  anamKeyRotationCursor += 1;
  return [...pool.slice(offset), ...pool.slice(0, offset)];
}

/** Prefer a known slot (e.g. where the avatar lives), then try the rest on quota errors. */
export function getAnamApiKeysInOrder(
  preferredSlot?: AnamApiKeySlot | string | null,
): AnamApiKeyPoolEntry[] {
  const pool = getAnamApiKeyPool();
  if (pool.length <= 1 || !preferredSlot) {
    return getAnamApiKeysInRotationOrder();
  }

  const preferredIndex = pool.findIndex((entry) => entry.slot === preferredSlot);
  if (preferredIndex === -1) {
    return getAnamApiKeysInRotationOrder();
  }

  return [...pool.slice(preferredIndex), ...pool.slice(0, preferredIndex)];
}

export async function readAnamErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      detail?: string;
    };
    return payload.message ?? payload.error ?? payload.detail ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

const ANAM_QUOTA_KEYWORDS = [
  "one-shot",
  "concurrent",
  "maximum",
  "quota",
  "limit",
  "exceeded",
  "credit",
  "capacity",
  "too many",
  "rate limit",
  "usage",
] as const;

export function isAnamAvatarQuotaError(status: number, detail: string): boolean {
  if (status === 429 || status === 402) {
    return true;
  }

  const normalized = detail.toLowerCase();
  const hasQuotaKeyword = ANAM_QUOTA_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );

  if (status === 403 || status === 400) {
    return hasQuotaKeyword;
  }

  return false;
}

async function anamFetch(
  path: string,
  init: RequestInit,
  apiKey: string,
): Promise<Response> {
  return fetch(`${getAnamApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function anamFetchWithSlot(
  path: string,
  init: RequestInit,
  slot: AnamApiKeySlot,
): Promise<Response> {
  const apiKey = getAnamApiKeyBySlot(slot);
  if (!apiKey) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  return anamFetch(path, init, apiKey);
}

export async function anamFetchWithKeyPool(
  path: string,
  init: RequestInit = {},
  preferredSlot?: AnamApiKeySlot | string | null,
): Promise<{ response: Response; slot: AnamApiKeySlot; label: string }> {
  const pool = getAnamApiKeysInOrder(preferredSlot);

  if (pool.length === 0) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  let lastError = "Anam request failed";

  for (const entry of pool) {
    const response = await anamFetch(path, init, entry.key);

    if (response.ok) {
      return { response, slot: entry.slot, label: entry.label };
    }

    const detail = await readAnamErrorMessage(response);
    lastError = `Anam request failed with status ${response.status}: ${detail}`;

    if (!isAnamAvatarQuotaError(response.status, detail)) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

/** Live Anam API probe — valid key returns 200 on personas list. */
export async function probeAnamApiKeyHealth(apiKey: string): Promise<{
  healthy: boolean;
  detail: string;
}> {
  try {
    const response = await anamFetch("/personas?perPage=1", { method: "GET" }, apiKey);

    if (response.ok) {
      return { healthy: true, detail: "API key valid" };
    }

    const message = await readAnamErrorMessage(response);
    return {
      healthy: false,
      detail: `HTTP ${response.status}: ${message}`,
    };
  } catch (error: unknown) {
    return {
      healthy: false,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function probeAnamApiKeyPoolHealth(): Promise<
  Array<{
    slot: AnamApiKeySlot;
    label: string;
    healthy: boolean;
    detail: string;
  }>
> {
  const pool = getAnamApiKeyPool();

  return Promise.all(
    pool.map(async (entry) => {
      const probe = await probeAnamApiKeyHealth(entry.key);
      return {
        slot: entry.slot,
        label: entry.label,
        healthy: probe.healthy,
        detail: probe.detail,
      };
    }),
  );
}
