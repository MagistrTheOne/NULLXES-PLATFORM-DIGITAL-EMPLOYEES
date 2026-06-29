import { provisionEmployeeProviders } from "../services/provision-employee-providers";
import { activateEmployeeAfterProvisioning } from "@/features/employee/services/activate-employee-after-provisioning";
import { logServerEvent } from "@/shared/lib/server-log";

/**
 * Runs provider provisioning after the current request finishes.
 * Do not call revalidatePath here — background completion can overlap page
 * renders and triggers Next.js "revalidatePath during render" errors.
 * Refresh the UI via revalidateEmployeePaths (server action) from the client.
 */
export function enqueueEmployeeProvisioning(employeeId: string): void {
  void provisionEmployeeProviders({ employeeId })
    .then(async (result) => {
      await activateEmployeeAfterProvisioning(employeeId, result);

      if (
        result.avatar.status === "failed" ||
        result.brain.status === "failed" ||
        result.voice.status === "failed"
      ) {
        logServerEvent(
          "employee.provisioning.partial_failure",
          {
            employeeId,
            avatarStatus: result.avatar.status,
            brainStatus: result.brain.status,
            voiceStatus: result.voice.status,
          },
          "warn",
        );
      }
    })
    .catch((error: unknown) => {
      logServerEvent(
        "employee.provisioning.crash",
        {
          employeeId,
          message: error instanceof Error ? error.message : "unknown",
        },
        "error",
      );
    });
}
