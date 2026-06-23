"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";
import { getEmployeeDetailShell } from "../services/get-employee-detail";

export type EmployeeProvisioningSnapshot = {
  avatarProvisioningStatus: ProviderProvisioningStatus;
  sessionProvisioningStatus: ProviderProvisioningStatus;
  brainProvisioningStatus: ProviderProvisioningStatus;
  avatarPreviewUrl: string | null;
  canTalk: boolean;
  failed: boolean;
};

export async function getEmployeeProvisioningSnapshotAction(
  employeeId: string,
): Promise<EmployeeProvisioningSnapshot | null> {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canOperateEmployees",
  );

  const employee = await getEmployeeDetailShell(
    workspace.organization.id,
    employeeId,
  );

  if (!employee) {
    return null;
  }

  const failed =
    employee.avatarProvisioningStatus === "failed" ||
    employee.sessionProvisioningStatus === "failed" ||
    employee.brainProvisioningStatus === "failed";

  return {
    avatarProvisioningStatus: employee.avatarProvisioningStatus,
    sessionProvisioningStatus: employee.sessionProvisioningStatus,
    brainProvisioningStatus: employee.brainProvisioningStatus,
    avatarPreviewUrl: employee.avatarPreviewUrl,
    canTalk: employee.canTalk,
    failed,
  };
}
