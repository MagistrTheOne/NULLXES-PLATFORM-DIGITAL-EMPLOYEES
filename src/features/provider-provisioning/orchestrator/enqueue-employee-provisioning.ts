import { revalidatePath } from "next/cache";
import { provisionEmployeeProviders } from "../services/provision-employee-providers";

export function enqueueEmployeeProvisioning(employeeId: string): void {
  void provisionEmployeeProviders({ employeeId })
    .then(() => {
      revalidatePath("/dashboard/employees");
      revalidatePath(`/dashboard/employees/${employeeId}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Provider provisioning failed for employee ${employeeId}:`,
        message,
      );
      revalidatePath("/dashboard/employees");
      revalidatePath(`/dashboard/employees/${employeeId}`);
    });
}
