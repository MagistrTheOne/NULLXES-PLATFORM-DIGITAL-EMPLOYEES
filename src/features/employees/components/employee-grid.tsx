import type { EmployeeListItem } from "../types";
import { platformEmployeeGridClass } from "@/shared/layout/platform-layout";
import { EmployeeCard } from "./employee-card";

export function EmployeeGrid({ employees }: { employees: EmployeeListItem[] }) {
  return (
    <ul className={platformEmployeeGridClass}>
      {employees.map((employee) => (
        <li key={employee.id} className="min-w-0">
          <EmployeeCard employee={employee} />
        </li>
      ))}
    </ul>
  );
}
