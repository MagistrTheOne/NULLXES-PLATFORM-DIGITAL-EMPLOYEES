"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import { CreateEmployeeDialog } from "@/features/employees/create";
import type { EmployeeListItem } from "../types";
import { EmployeeEmptyState } from "./employee-empty-state";
import { EmployeeGrid } from "./employee-grid";
import { EmployeeMetrics } from "./employee-metrics";
import { EmployeeToolbar } from "./employee-toolbar";

function matchesSearch(employee: EmployeeListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    employee.name.toLowerCase().includes(normalized) ||
    employee.role.toLowerCase().includes(normalized)
  );
}

export function EmployeesScreen({
  employees,
}: {
  employees: EmployeeListItem[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EmployeeStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const statusMatches =
        statusFilter === "all" || employee.status === statusFilter;
      return statusMatches && matchesSearch(employee, searchQuery);
    });
  }, [employees, searchQuery, statusFilter]);

  const hasEmployees = employees.length > 0;

  async function handleCreateComplete({
    employeeId,
  }: {
    employeeId: string;
    avatarProvisionStarted: boolean;
  }): Promise<void> {
    router.refresh();

    const refreshDelaysMs = [8000, 30000, 90000];
    for (const delayMs of refreshDelaysMs) {
      window.setTimeout(() => {
        void revalidateEmployeePaths(employeeId).then(() => router.refresh());
      }, delayMs);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Digital Employees
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Manage and operate your digital workforce.
          </p>
        </div>

        {hasEmployees ? (
          <>
            <EmployeeMetrics employees={employees} />
            <EmployeeToolbar
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onSearchQueryChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
              onCreateClick={() => setCreateDialogOpen(true)}
            />
            {filteredEmployees.length > 0 ? (
              <EmployeeGrid employees={filteredEmployees} />
            ) : (
              <p className="py-8 text-center text-sm text-white/50">
                No employees match your search or filters.
              </p>
            )}
          </>
        ) : (
          <EmployeeEmptyState onCreateClick={() => setCreateDialogOpen(true)} />
        )}
      </div>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={handleCreateComplete}
      />
    </>
  );
}
