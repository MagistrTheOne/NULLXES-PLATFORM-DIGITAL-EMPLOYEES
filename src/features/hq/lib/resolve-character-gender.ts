export type CharacterGender = "female" | "male";

/**
 * Known NULLXES roster → gender, so the right body attaches to each digital
 * employee. Extend this map as the workforce grows (or override per-employee
 * later). Keys are lowercased names.
 */
const ROSTER_GENDER: Record<string, CharacterGender> = {
  somnia: "female",
  somnae: "female",
  kira: "female",
  kaira: "female",
  yuki: "female",
  serena: "female",
  lily: "female",
  lili: "female",
  carolina: "female",
  megan: "female",
  vine: "female",
  atlas: "male",
  max: "male",
  leo: "male",
  victor: "male",
  marcus: "male",
  oliver: "male",
};

const FEMALE_HINTS = ["a", "e", "i", "я", "а", "ия", "на"];

/**
 * Resolve which character model a digital employee should use. Prefers the
 * explicit roster, then a light name heuristic (many female names end in a
 * vowel), defaulting to male. Deterministic per name.
 */
export function resolveCharacterGender(name: string): CharacterGender {
  const key = name.trim().toLowerCase();
  if (key in ROSTER_GENDER) {
    return ROSTER_GENDER[key];
  }

  const first = key.split(/\s+/)[0] ?? key;
  if (FEMALE_HINTS.some((hint) => first.endsWith(hint))) {
    return "female";
  }
  return "male";
}
