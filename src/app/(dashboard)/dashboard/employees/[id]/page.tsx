import { notFound } from "next/navigation";
import { isPlatformAdminEmail } from "@/features/admin";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { getOrganizationDisplayPreferences } from "@/features/workspace/services/get-organization-display-preferences";
import {
  EmployeeDetailScreen,
  getEmployeeDetailShell,
} from "@/features/employees";
import { EmployeeDetailMaterializationHost } from "@/features/employees/components/employee-detail-materialization-host";
import type { EmployeeDetailShell } from "@/features/employees/types";

function redactOperatorFields(
  employee: EmployeeDetailShell,
): EmployeeDetailShell {
  return {
    ...employee,
    anamApiKeySlot: null,
    avatarId: null,
    personaId: null,
    anamVoiceId: null,
    voiceId: null,
    studioVoiceId: null,
    voiceBinding: null,
    avatarProvisioningFailureReason: null,
    sessionProvisioningFailureReason: null,
    brainProvisioningFailureReason: null,
  };
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const [employee, displayPreferences] = await Promise.all([
    getEmployeeDetailShell(workspace.organization.id, id),
    getOrganizationDisplayPreferences(workspace.organization.id),
  ]);

  if (!employee) {
    notFound();
  }

  const isPlatformAdmin = isPlatformAdminEmail(session.user.email);
  const employeeForClient = isPlatformAdmin
    ? employee
    : redactOperatorFields(employee);

  return (
    <EmployeeDetailMaterializationHost employee={employeeForClient}>
      <EmployeeDetailScreen
        employee={employee}
        organizationId={workspace.organization.id}
        displayPreferences={displayPreferences}
      />
    </EmployeeDetailMaterializationHost>
  );
}
