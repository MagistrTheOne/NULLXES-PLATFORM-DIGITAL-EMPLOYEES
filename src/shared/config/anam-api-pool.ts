const ANAM_API_BASE_URL_DEFAULT = "https://api.anam.ai/v1";

export const ANAM_API_KEY_SLOTS = [
  "ANAM_API_KEY",
  "ANAM_API_KEY_2",
  "ANAM_API_KEY_3",
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

export function isAnamAvatarQuotaError(status: number, detail: string): boolean {
  if (status !== 403) {
    return false;
  }

  const normalized = detail.toLowerCase();
  return (
    normalized.includes("one-shot") ||
    normalized.includes("concurrent") ||
    normalized.includes("maximum")
  );
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
): Promise<{ response: Response; slot: AnamApiKeySlot; label: string }> {
  const pool = getAnamApiKeysInRotationOrder();

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
