import { provisionEmployeeProviders } from "../services/provision-employee-providers";

/**
 * Runs provider provisioning after the current request finishes.
 * Do not call revalidatePath here — background completion can overlap page
 * renders and triggers Next.js "revalidatePath during render" errors.
 * Refresh the UI via revalidateEmployeePaths (server action) from the client.
 */
export function enqueueEmployeeProvisioning(employeeId: string): void {
  void provisionEmployeeProviders({ employeeId }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Provider provisioning failed for employee ${employeeId}:`,
      message,
    );
  });
}
