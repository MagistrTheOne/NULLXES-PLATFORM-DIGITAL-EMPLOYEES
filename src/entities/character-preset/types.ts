export type CharacterTraits = {
  formality: number;
  empathy: number;
  assertiveness: number;
  verbosity: number;
};

export type CharacterSpeechStyle = {
  openingBehavior: string;
  closingBehavior: string;
  catchphrases: string[];
};

export type CharacterLanguagePolicy = "ru" | "en" | "auto";
