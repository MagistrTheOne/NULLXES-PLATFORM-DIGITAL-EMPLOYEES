import { loadEnvFiles } from "@/shared/config/load-env-files";
import { activateEmployeeAfterProvisioning } from "@/features/employee/services/activate-employee-after-provisioning";

loadEnvFiles();

const employeeId = process.argv[2];

async function main(): Promise<void> {
  if (!employeeId) {
    console.error("Usage: activate-employee-after-provisioning <employeeId>");
    process.exit(1);
  }

  await activateEmployeeAfterProvisioning(employeeId, {
    brain: { status: "ready" },
    avatar: { status: "ready" },
    voice: { status: "ready" },
  });

  console.log(`Activation attempted for ${employeeId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
