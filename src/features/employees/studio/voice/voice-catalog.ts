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
}): StudioVoiceOption[] {
  const normalizedQuery = input.query.trim().toLowerCase();

  return STUDIO_VOICES.filter((voice) => {
    if (input.provider !== "all" && voice.provider !== input.provider) {
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
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
