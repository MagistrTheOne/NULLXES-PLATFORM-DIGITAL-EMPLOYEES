import {
  matchesStudioVoiceGenderFilter,
  type StudioVoiceGenderFilter,
} from "./normalize-studio-voice-gender";

export type { StudioVoiceGenderFilter };

export type StudioVoiceProvider = "Anam" | "ElevenLabs";

export type StudioVoiceOption = {
  id: string;
  name: string;
  gender: string;
  language: string;
  provider: StudioVoiceProvider;
  /** Used for ElevenLabs TTS preview and session config */
  elevenLabsVoiceId?: string;
  /** Used for Anam persona binding when provider is Anam */
  anamVoiceId?: string;
};

export const STUDIO_VOICE_PREVIEW_TEXT =
  "Welcome to NULLXES Digital Employees";

export const STUDIO_VOICES: StudioVoiceOption[] = [
  {
    id: "anam-lucy",
    name: "Lucy",
    gender: "Female",
    language: "English",
    provider: "Anam",
    anamVoiceId: "de23e340-1416-4dd8-977d-065a7ca11697",
  },
  {
    id: "anam-george",
    name: "George (Anam)",
    gender: "Male",
    language: "English",
    provider: "Anam",
    anamVoiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
  },
  {
    id: "elevenlabs-george",
    name: "George",
    gender: "Male",
    language: "English",
    provider: "ElevenLabs",
    elevenLabsVoiceId: "JBFqnCBsd6RMkjVDRZzb",
  },
  {
    id: "elevenlabs-sarah",
    name: "Sarah",
    gender: "Female",
    language: "English",
    provider: "ElevenLabs",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    id: "elevenlabs-laura",
    name: "Laura",
    gender: "Female",
    language: "English",
    provider: "ElevenLabs",
    elevenLabsVoiceId: "FGY2WhTYpPnrIDTdsKH5",
  },
  {
    id: "elevenlabs-charlie",
    name: "Charlie",
    gender: "Male",
    language: "English",
    provider: "ElevenLabs",
    elevenLabsVoiceId: "IKne3meq5aSn9XLyUdCD",
  },
];

export const CUSTOM_ELEVENLABS_STUDIO_VOICE_ID = "custom-elevenlabs";
export const ELEVENLABS_API_VOICE_ID_PREFIX = "elevenlabs-api-";

export function getAnamStudioVoices(): StudioVoiceOption[] {
  return STUDIO_VOICES.filter((voice) => voice.provider === "Anam");
}

export function getStaticElevenLabsStudioVoices(): StudioVoiceOption[] {
  return STUDIO_VOICES.filter((voice) => voice.provider === "ElevenLabs");
}

export function mergeElevenLabsStudioVoices(
  apiVoices: StudioVoiceOption[],
): StudioVoiceOption[] {
  const staticIds = new Set(
    getStaticElevenLabsStudioVoices()
      .map((voice) => voice.elevenLabsVoiceId)
      .filter(Boolean),
  );

  const merged = [
    ...getStaticElevenLabsStudioVoices(),
    ...apiVoices.filter(
      (voice) => !staticIds.has(voice.elevenLabsVoiceId),
    ),
  ];

  return merged.sort((left, right) => left.name.localeCompare(right.name));
}

export function buildStudioVoiceCatalog(
  apiElevenLabsVoices: StudioVoiceOption[] = [],
): StudioVoiceOption[] {
  return [...getAnamStudioVoices(), ...mergeElevenLabsStudioVoices(apiElevenLabsVoices)];
}

export function createCustomElevenLabsVoiceOption(
  elevenLabsVoiceId: string,
): StudioVoiceOption {
  const shortId =
    elevenLabsVoiceId.length > 12
      ? `${elevenLabsVoiceId.slice(0, 8)}…`
      : elevenLabsVoiceId;

  return {
    id: CUSTOM_ELEVENLABS_STUDIO_VOICE_ID,
    name: "Custom ElevenLabs voice",
    gender: "Custom",
    language: "Your account",
    provider: "ElevenLabs",
    elevenLabsVoiceId,
  };
}

export function resolveStudioVoiceSelection(
  studioVoiceId: string,
  customElevenLabsVoiceId?: string,
  catalog: StudioVoiceOption[] = STUDIO_VOICES,
): StudioVoiceOption | undefined {
  if (studioVoiceId.startsWith(ELEVENLABS_API_VOICE_ID_PREFIX)) {
    const elevenLabsVoiceId = studioVoiceId.slice(
      ELEVENLABS_API_VOICE_ID_PREFIX.length,
    );

    if (!elevenLabsVoiceId) {
      return undefined;
    }

    return (
      catalog.find((voice) => voice.id === studioVoiceId) ?? {
        id: studioVoiceId,
        name: elevenLabsVoiceId,
        gender: "Neutral",
        language: "English",
        provider: "ElevenLabs",
        elevenLabsVoiceId,
      }
    );
  }

  if (studioVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID) {
    return getStudioVoiceById(studioVoiceId, customElevenLabsVoiceId);
  }

  return catalog.find((voice) => voice.id === studioVoiceId);
}

export function getStudioVoiceById(
  voiceId: string,
  customElevenLabsVoiceId?: string,
): StudioVoiceOption | undefined {
  if (voiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID) {
    const trimmed = customElevenLabsVoiceId?.trim();
    return trimmed ? createCustomElevenLabsVoiceOption(trimmed) : undefined;
  }

  return STUDIO_VOICES.find((voice) => voice.id === voiceId);
}

export function filterStudioVoices(input: {
  query: string;
  provider: "all" | StudioVoiceProvider;
  gender?: StudioVoiceGenderFilter;
  voices?: StudioVoiceOption[];
}): StudioVoiceOption[] {
  const normalizedQuery = input.query.trim().toLowerCase();
  const source = input.voices ?? STUDIO_VOICES;

  return source.filter((voice) => {
    if (input.provider !== "all" && voice.provider !== input.provider) {
      return false;
    }

    if (
      input.gender &&
      !matchesStudioVoiceGenderFilter(voice.gender, input.gender)
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      voice.name,
      voice.gender,
      voice.language,
      voice.provider,
      voice.id,
      voice.elevenLabsVoiceId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
