import { loadEnvFiles } from "@/shared/config/load-env-files";
import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { applyDefaultEmployeeBlueprint } from "@/features/agent-blueprint/services/apply-default-employee-blueprint";
import { seedSystemBlueprintCatalog } from "@/features/agent-blueprint/services/seed-system-blueprint-catalog";
import { db } from "@/shared/db/client";

loadEnvFiles();

async function main(): Promise<void> {
  await seedSystemBlueprintCatalog();

  const employees = await db
    .select({
      id: digitalEmployee.id,
      organizationId: digitalEmployee.organizationId,
      role: digitalEmployee.role,
    })
    .from(digitalEmployee);

  let updated = 0;

  for (const employee of employees) {
    const [existing] = await db
      .select({ id: employeeCharacter.id })
      .from(employeeCharacter)
      .where(eq(employeeCharacter.employeeId, employee.id))
      .limit(1);

    if (existing) {
      continue;
    }

    await applyDefaultEmployeeBlueprint({
      organizationId: employee.organizationId,
      employeeId: employee.id,
      role: employee.role,
    });
    updated += 1;
  }

  console.log(`blueprint:backfill applied defaults to ${updated} employee(s)`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
