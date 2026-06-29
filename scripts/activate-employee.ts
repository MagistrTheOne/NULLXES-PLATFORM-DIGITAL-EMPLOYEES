import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { activateEmployeeAfterProvisioning } from "@/features/employee/services/activate-employee-after-provisioning";
import type { ProvisionEmployeeProvidersResult } from "@/features/provider-provisioning/types";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const employeeId = process.argv[2];

const ALL_READY: ProvisionEmployeeProvidersResult = {
  brain: { status: "ready" },
  avatar: { status: "ready" },
  voice: { status: "ready" },
};

async function main(): Promise<void> {
  if (!employeeId) {
    console.error("Usage: activate-employee <employeeId>");
    process.exit(1);
  }

  await activateEmployeeAfterProvisioning(employeeId, ALL_READY);

  const [employee] = await db
    .select({ status: digitalEmployee.status, name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  console.log("Employee status:", employee);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
