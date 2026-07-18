/**
 * Voice reward packs → ElevenLabs Voice Design (text-to-voice).
 * Docs: POST /v1/text-to-voice/design then POST /v1/text-to-voice
 * Each pack has male/female prompts; gender resolved from employee name.
 */
import type { CharacterGender } from "@/features/hq/lib/resolve-character-gender";

export type VoicePackDef = {
  slug: string;
  name: string;
  /** Env override: ELEVENLABS_VOICE_PACK_<SLUG_UPPER>_FEMALE / _MALE */
  prompts: Record<CharacterGender, string>;
};

export const VOICE_PACKS: Record<string, VoicePackDef> = {
  "exec-voice": {
    slug: "exec-voice",
    name: "Executive Voice",
    prompts: {
      female:
        "Native English. Female, mid-30s. Perfect audio quality. Persona: executive closer. Emotion: calm, confident. Clear corporate timbre, measured pacing, boardroom presence without aggression.",
      male:
        "Native English. Male, mid-30s. Perfect audio quality. Persona: executive closer. Emotion: calm, confident. Clear corporate timbre, measured pacing, boardroom presence without aggression.",
    },
  },
  "calm-voice": {
    slug: "calm-voice",
    name: "Calm & Confident",
    prompts: {
      female:
        "Native English. Female, late-20s. Perfect audio quality. Persona: support lead. Emotion: warm, steady. Soft mid-pitch, unhurried pacing, reassuring reception tone.",
      male:
        "Native English. Male, late-20s. Perfect audio quality. Persona: support lead. Emotion: warm, steady. Soft mid-pitch, unhurried pacing, reassuring reception tone.",
    },
  },
  "board-presence": {
    slug: "board-presence",
    name: "Board Presence",
    prompts: {
      female:
        "Native English. Female, early-40s. Perfect audio quality. Persona: leadership brief. Emotion: composed, precise. Lower-pitched authoritative delivery for executive briefings.",
      male:
        "Native English. Male, early-40s. Perfect audio quality. Persona: leadership brief. Emotion: composed, precise. Lower-pitched authoritative delivery for executive briefings.",
    },
  },
  "briefing-tone": {
    slug: "briefing-tone",
    name: "Briefing Tone",
    prompts: {
      female:
        "Native English. Female, mid-30s. Perfect audio quality. Persona: ops briefer. Emotion: sharp, focused. Crisp diction, slightly faster pacing for status updates.",
      male:
        "Native English. Male, mid-30s. Perfect audio quality. Persona: ops briefer. Emotion: sharp, focused. Crisp diction, slightly faster pacing for status updates.",
    },
  },
};

export function getVoicePack(slug: string): VoicePackDef | null {
  return VOICE_PACKS[slug] ?? null;
}

export function voicePackEnvKey(
  slug: string,
  gender: CharacterGender,
): string {
  const base = slug.replace(/-/g, "_").toUpperCase();
  return `ELEVENLABS_VOICE_PACK_${base}_${gender.toUpperCase()}`;
}

/** Cache format in reward_definition.boost_label: el_f:<id>;el_m:<id> */
export function parseVoicePackCache(
  boostLabel: string | null | undefined,
): Partial<Record<CharacterGender, string>> {
  if (!boostLabel) return {};
  const out: Partial<Record<CharacterGender, string>> = {};
  for (const part of boostLabel.split(";")) {
    const [key, id] = part.split(":");
    if (!id) continue;
    if (key === "el_f") out.female = id;
    if (key === "el_m") out.male = id;
  }
  return out;
}

export function serializeVoicePackCache(
  cache: Partial<Record<CharacterGender, string>>,
): string {
  const parts: string[] = [];
  if (cache.female) parts.push(`el_f:${cache.female}`);
  if (cache.male) parts.push(`el_m:${cache.male}`);
  return parts.join(";");
}
