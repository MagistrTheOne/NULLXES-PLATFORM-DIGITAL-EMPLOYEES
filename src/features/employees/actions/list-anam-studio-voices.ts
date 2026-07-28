"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  anamFetchWithKeyPool,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import {
  ANAM_API_VOICE_ID_PREFIX,
  type StudioVoiceOption,
} from "../studio/voice/voice-catalog";
import { normalizeStudioVoiceGender } from "../studio/voice/normalize-studio-voice-gender";

type AnamVoiceRow = {
  id?: string;
  displayName?: string;
  gender?: string;
  country?: string;
};

type AnamVoicesListResponse = {
  data?: AnamVoiceRow[];
  meta?: {
    currentPage?: number;
    lastPage?: number;
    next?: number | string | null;
  };
};

export type ListAnamStudioVoicesResult =
  | { ok: true; voices: StudioVoiceOption[] }
  | { ok: false; message: string };

function mapCountryToLanguage(country?: string): string {
  const code = country?.trim().toUpperCase();
  if (!code) {
    return "English";
  }

  const map: Record<string, string> = {
    GB: "English (UK)",
    US: "English (US)",
    AU: "English (AU)",
    IE: "English (IE)",
    CA: "English (CA)",
    DE: "German",
    FR: "French",
    ES: "Spanish",
    IT: "Italian",
    PT: "Portuguese",
    BR: "Portuguese (BR)",
    NL: "Dutch",
    PL: "Polish",
    RU: "Russian",
    JP: "Japanese",
    KR: "Korean",
    CN: "Chinese",
    IN: "Hindi",
  };

  return map[code] ?? code;
}

async function fetchAnamVoicePage(
  page: number,
): Promise<AnamVoicesListResponse> {
  const { response } = await anamFetchWithKeyPool(
    `/voices?perPage=100&page=${page}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(`Anam voices request failed (${response.status})`);
  }

  return (await response.json()) as AnamVoicesListResponse;
}

export async function listAnamStudioVoices(): Promise<ListAnamStudioVoicesResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  if (!hasAnamCredentials()) {
    return { ok: false, message: "ANAM_API_KEY is not configured" };
  }

  try {
    const rows: AnamVoiceRow[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const payload = await fetchAnamVoicePage(page);
      rows.push(...(payload.data ?? []));
      lastPage = Math.max(1, Number(payload.meta?.lastPage ?? page) || page);
      page += 1;
    } while (page <= lastPage && page <= 20);

    const voices = rows
      .filter((voice) => Boolean(voice.id && voice.displayName))
      .map((voice) => ({
        id: `${ANAM_API_VOICE_ID_PREFIX}${voice.id}`,
        name: voice.displayName!.trim(),
        gender: normalizeStudioVoiceGender(voice.gender),
        language: mapCountryToLanguage(voice.country),
        provider: "Anam" as const,
        anamVoiceId: voice.id!,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return { ok: true, voices };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to load Anam voices",
    };
  }
}
