import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { deleteEmployee } from "@/features/employees/services/delete-employee";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const employeeId = process.argv[2];

async function main(): Promise<void> {
  if (!employeeId) {
    console.error("Usage: delete-employee-by-id <employeeId>");
    process.exit(1);
  }

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      organizationId: digitalEmployee.organizationId,
      avatarProvider: digitalEmployee.avatarProvider,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    console.log(`No digital employee with id ${employeeId}`);
    return;
  }

  console.log("Deleting employee:", employee);

  const result = await deleteEmployee(employee.organizationId, employeeId);

  if (!result.ok) {
    console.error("Delete failed:", result.message);
    process.exit(1);
  }

  console.log("Deleted from database and Anam (persona + custom avatar if any).");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
