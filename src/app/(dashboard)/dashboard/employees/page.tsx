import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { EmployeeList, listOrganizationEmployees } from "@/features/employees";

export default async function DigitalEmployeesPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(
    session.user.id,
    session.user.name,
  );

  const employees = await listOrganizationEmployees(workspace.organization.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Digital Employees
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Manage and operate your digital workforce.
        </p>
      </div>
      <EmployeeList employees={employees} />
    </div>
  );
}
