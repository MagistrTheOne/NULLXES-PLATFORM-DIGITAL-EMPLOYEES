import type {
  CharacterLanguagePolicy,
  CharacterSpeechStyle,
  CharacterTraits,
} from "@/entities/character-preset/types";
import type { EmployeeCharacterTraitOverrides } from "@/entities/employee-character/types";

function traitLabel(value: number): string {
  if (value <= 2) return "low";
  if (value >= 4) return "high";
  return "moderate";
}

export function mergeCharacterTraits(
  base: CharacterTraits,
  overrides?: EmployeeCharacterTraitOverrides,
): CharacterTraits {
  return {
    formality: overrides?.formality ?? base.formality,
    empathy: overrides?.empathy ?? base.empathy,
    assertiveness: overrides?.assertiveness ?? base.assertiveness,
    verbosity: overrides?.verbosity ?? base.verbosity,
  };
}

export function compileCharacterPromptBlock(input: {
  name: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries?: string | null;
  languagePolicy?: CharacterLanguagePolicy;
  customPromptBlock?: string | null;
}): string {
  const traits = input.traits;
  const language =
    input.languagePolicy === "en"
      ? "Default to English unless the user prefers Russian."
      : input.languagePolicy === "auto"
        ? "Match the user's language."
        : "Default to Russian unless the user explicitly requests English.";

  const sections = [
    `Character profile — ${input.name}:`,
    `- Formality: ${traitLabel(traits.formality)} (${traits.formality}/5)`,
    `- Empathy: ${traitLabel(traits.empathy)} (${traits.empathy}/5)`,
    `- Assertiveness: ${traitLabel(traits.assertiveness)} (${traits.assertiveness}/5)`,
    `- Verbosity: ${traitLabel(traits.verbosity)} (${traits.verbosity}/5)`,
    `- Opening: ${input.speechStyle.openingBehavior}`,
    `- Closing: ${input.speechStyle.closingBehavior}`,
    input.speechStyle.catchphrases.length > 0
      ? `- Signature phrases (use sparingly): ${input.speechStyle.catchphrases.join("; ")}`
      : null,
    input.boundaries?.trim() ? `- Boundaries: ${input.boundaries.trim()}` : null,
    `- Language: ${language}`,
    input.customPromptBlock?.trim()
      ? `\nAdditional character notes:\n${input.customPromptBlock.trim()}`
      : null,
  ].filter(Boolean);

  return sections.join("\n");
}
