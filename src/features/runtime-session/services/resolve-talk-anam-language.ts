import "server-only";

import { and, eq } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import type { AppLocale } from "@/i18n/config";
import { db } from "@/shared/db/client";
import { resolveTalkSpeechLanguageCode } from "./resolve-talk-speech-language";

/** Anam STT language — blueprint character policy first, then UI/org locale. */
export async function resolveTalkAnamLanguageCode(input: {
  organizationId: string;
  employeeId: string;
}): Promise<AppLocale> {
  const [characterRow] = await db
    .select({
      languagePolicy: characterPreset.languagePolicy,
    })
    .from(employeeCharacter)
    .leftJoin(
      characterPreset,
      eq(employeeCharacter.presetId, characterPreset.id),
    )
    .where(
      and(
        eq(employeeCharacter.organizationId, input.organizationId),
        eq(employeeCharacter.employeeId, input.employeeId),
      ),
    )
    .limit(1);

  const policy = characterRow?.languagePolicy;
  if (policy === "ru" || policy === "en") {
    return policy;
  }

  return resolveTalkSpeechLanguageCode(input.organizationId);
}
