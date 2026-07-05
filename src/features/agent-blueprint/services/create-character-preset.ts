import { and, eq } from "drizzle-orm";
import type {
  CharacterLanguagePolicy,
  CharacterSpeechStyle,
  CharacterTraits,
} from "@/entities/character-preset/types";
import { characterPreset } from "@/entities/character-preset/schema";
import { compileCharacterPromptBlock } from "@/features/agent-blueprint/lib/compile-character-prompt";
import { db } from "@/shared/db/client";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export async function createCharacterPreset(input: {
  organizationId: string;
  name: string;
  description?: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries?: string;
  languagePolicy?: CharacterLanguagePolicy;
  slug?: string;
}): Promise<string> {
  const slug = input.slug?.trim() || slugify(input.name);
  const promptBlock = compileCharacterPromptBlock({
    name: input.name,
    traits: input.traits,
    speechStyle: input.speechStyle,
    boundaries: input.boundaries,
    languagePolicy: input.languagePolicy ?? "ru",
  });

  const [row] = await db
    .insert(characterPreset)
    .values({
      organizationId: input.organizationId,
      slug,
      name: input.name,
      description: input.description ?? null,
      traits: input.traits,
      speechStyle: input.speechStyle,
      boundaries: input.boundaries ?? null,
      languagePolicy: input.languagePolicy ?? "ru",
      promptBlock,
      isSystemTemplate: false,
    })
    .returning({ id: characterPreset.id });

  return row.id;
}

export async function updateCharacterPreset(input: {
  organizationId: string;
  presetId: string;
  name: string;
  description?: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries?: string;
  languagePolicy?: CharacterLanguagePolicy;
}): Promise<void> {
  const [existing] = await db
    .select()
    .from(characterPreset)
    .where(
      and(
        eq(characterPreset.id, input.presetId),
        eq(characterPreset.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!existing || existing.isSystemTemplate) {
    throw new Error("Character preset not found or read-only");
  }

  const promptBlock = compileCharacterPromptBlock({
    name: input.name,
    traits: input.traits,
    speechStyle: input.speechStyle,
    boundaries: input.boundaries,
    languagePolicy: input.languagePolicy ?? existing.languagePolicy,
  });

  await db
    .update(characterPreset)
    .set({
      name: input.name,
      description: input.description ?? null,
      traits: input.traits,
      speechStyle: input.speechStyle,
      boundaries: input.boundaries ?? null,
      languagePolicy: input.languagePolicy ?? existing.languagePolicy,
      promptBlock,
      updatedAt: new Date(),
    })
    .where(eq(characterPreset.id, input.presetId));
}

export async function deleteCharacterPreset(input: {
  organizationId: string;
  presetId: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: characterPreset.id })
    .from(characterPreset)
    .where(
      and(
        eq(characterPreset.id, input.presetId),
        eq(characterPreset.organizationId, input.organizationId),
        eq(characterPreset.isSystemTemplate, false),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Character preset not found or read-only");
  }

  await db.delete(characterPreset).where(eq(characterPreset.id, input.presetId));
}

export async function duplicateCharacterPreset(input: {
  organizationId: string;
  sourcePresetId: string;
  name?: string;
}): Promise<string> {
  const [source] = await db
    .select()
    .from(characterPreset)
    .where(eq(characterPreset.id, input.sourcePresetId))
    .limit(1);

  if (!source) {
    throw new Error("Source preset not found");
  }

  const name = input.name?.trim() || `${source.name} (copy)`;
  return createCharacterPreset({
    organizationId: input.organizationId,
    name,
    description: source.description ?? undefined,
    traits: source.traits,
    speechStyle: source.speechStyle,
    boundaries: source.boundaries ?? undefined,
    languagePolicy: source.languagePolicy,
  });
}
