import { and, eq } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import type { EmployeeCharacterTraitOverrides } from "@/entities/employee-character/types";
import {
  compileCharacterPromptBlock,
  mergeCharacterTraits,
} from "@/features/agent-blueprint/lib/compile-character-prompt";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";

async function assertEmployeeInOrg(organizationId: string, employeeId: string) {
  await forbidCatalogMutation(employeeId);

  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, employeeId),
        eq(digitalEmployee.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new Error("Employee not found");
  }
}

export async function upsertEmployeeCharacter(input: {
  organizationId: string;
  employeeId: string;
  presetId?: string | null;
  traitOverrides?: EmployeeCharacterTraitOverrides;
  customPromptBlock?: string | null;
}): Promise<void> {
  await assertEmployeeInOrg(input.organizationId, input.employeeId);

  let preset = null;
  if (input.presetId) {
    const [row] = await db
      .select()
      .from(characterPreset)
      .where(
        and(
          eq(characterPreset.id, input.presetId),
          orgOrSystemScope(input.organizationId, characterPreset.organizationId),
        ),
      )
      .limit(1);
    preset = row ?? null;
  }

  const traitOverrides = input.traitOverrides ?? {};
  const traits = preset
    ? mergeCharacterTraits(preset.traits, traitOverrides)
    : {
        formality: traitOverrides.formality ?? 3,
        empathy: traitOverrides.empathy ?? 3,
        assertiveness: traitOverrides.assertiveness ?? 3,
        verbosity: traitOverrides.verbosity ?? 3,
      };

  const speechStyle = preset?.speechStyle ?? {
    openingBehavior: "Acknowledge the user briefly, then address their need.",
    closingBehavior: "Confirm next steps when relevant.",
    catchphrases: [],
  };

  const compiledPromptBlock = compileCharacterPromptBlock({
    name: preset?.name ?? "Custom character",
    traits,
    speechStyle,
    boundaries: preset?.boundaries,
    languagePolicy: preset?.languagePolicy ?? "ru",
    customPromptBlock: input.customPromptBlock,
  });

  const [existing] = await db
    .select({ id: employeeCharacter.id })
    .from(employeeCharacter)
    .where(eq(employeeCharacter.employeeId, input.employeeId))
    .limit(1);

  if (existing) {
    await db
      .update(employeeCharacter)
      .set({
        presetId: input.presetId ?? null,
        traitOverrides,
        customPromptBlock: input.customPromptBlock ?? null,
        compiledPromptBlock,
        updatedAt: new Date(),
      })
      .where(eq(employeeCharacter.id, existing.id));
    return;
  }

  await db.insert(employeeCharacter).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    presetId: input.presetId ?? null,
    traitOverrides,
    customPromptBlock: input.customPromptBlock ?? null,
    compiledPromptBlock,
  });
}
