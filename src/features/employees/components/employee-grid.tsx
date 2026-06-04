import type { EmployeeListItem } from "../types";
import { EmployeeCard } from "./employee-card";

export function EmployeeGrid({ employees }: { employees: EmployeeListItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {employees.map((employee) => (
        <li key={employee.id} className="min-w-0">
          <EmployeeCard employee={employee} />
        </li>
      ))}
    </ul>
  );
}
