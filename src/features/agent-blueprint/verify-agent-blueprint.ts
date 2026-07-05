import { loadEnvFiles } from "@/shared/config/load-env-files";
import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { applyDefaultEmployeeBlueprint } from "@/features/agent-blueprint/services/apply-default-employee-blueprint";
import {
  createCharacterPreset,
  deleteCharacterPreset,
} from "@/features/agent-blueprint/services/create-character-preset";
import { createSkill, deleteSkill } from "@/features/agent-blueprint/services/create-skill";
import { seedSystemBlueprintCatalog } from "@/features/agent-blueprint/services/seed-system-blueprint-catalog";
import { upsertEmployeeCharacter } from "@/features/agent-blueprint/services/upsert-employee-character";
import { assignEmployeeSkills } from "@/features/agent-blueprint/services/assign-employee-skills";
import { getEmployeeBlueprint } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { getSkillBySlug } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { db } from "@/shared/db/client";

loadEnvFiles();

async function main(): Promise<void> {
  await seedSystemBlueprintCatalog();

  const org = await createOrganization({
    name: `Blueprint Verify ${Date.now()}`,
    slug: `blueprint-verify-${Date.now()}`,
    type: "enterprise",
  });

  const presetId = await createCharacterPreset({
    organizationId: org.id,
    name: "Verify Preset",
    traits: { formality: 4, empathy: 3, assertiveness: 3, verbosity: 3 },
    speechStyle: {
      openingBehavior: "Test opening",
      closingBehavior: "Test closing",
      catchphrases: [],
    },
  });

  const skillId = await createSkill({
    organizationId: org.id,
    name: "Verify Skill",
    instructions: "Do the verify procedure.",
    triggers: { keywords: ["verify"], intents: [] },
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Verify Employee",
      role: "Enterprise Sales",
      status: "draft",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning({ id: digitalEmployee.id });

  if (!employee) {
    throw new Error("Failed to create employee");
  }

  await applyDefaultEmployeeBlueprint({
    organizationId: org.id,
    employeeId: employee.id,
    role: "Enterprise Sales",
  });

  await upsertEmployeeCharacter({
    organizationId: org.id,
    employeeId: employee.id,
    presetId,
  });

  const discovery = await getSkillBySlug({
    organizationId: org.id,
    slug: "b2b_discovery",
  });

  if (!discovery) {
    throw new Error("System skill b2b_discovery missing after seed");
  }

  await assignEmployeeSkills({
    organizationId: org.id,
    employeeId: employee.id,
    assignments: [{ skillId: discovery.id, priority: 0 }],
  });

  const blueprint = await getEmployeeBlueprint({
    organizationId: org.id,
    employeeId: employee.id,
  });

  if (!blueprint.characterPromptBlock?.includes("Verify Preset")) {
    throw new Error("Character prompt block not applied");
  }

  if (blueprint.activeSkills.length === 0) {
    throw new Error("Expected active skills on employee");
  }

  if (blueprint.enabledToolSlugs.length === 0) {
    throw new Error("Expected enabled tools on employee");
  }

  const [characterRow] = await db
    .select()
    .from(employeeCharacter)
    .where(eq(employeeCharacter.employeeId, employee.id))
    .limit(1);

  if (!characterRow) {
    throw new Error("employee_character row missing");
  }

  await deleteCharacterPreset({ organizationId: org.id, presetId });
  await deleteSkill({ organizationId: org.id, skillId });

  console.log("agent-blueprint:verify OK");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
