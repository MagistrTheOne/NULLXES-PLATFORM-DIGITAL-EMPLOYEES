import type { EmployeeListItem } from "../types";
import { EmployeeCard } from "./employee-card";
import { EmployeesEmptyState } from "./empty-state";

export function EmployeeList({ employees }: { employees: EmployeeListItem[] }) {
  if (employees.length === 0) {
    return <EmployeesEmptyState />;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => (
        <li key={employee.id}>
          <EmployeeCard employee={employee} />
        </li>
      ))}
    </ul>
  );
}
