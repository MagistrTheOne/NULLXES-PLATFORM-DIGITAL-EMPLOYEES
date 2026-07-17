import type { EmployeeListItem } from "../types";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";
import { platformEmployeeGridClass } from "@/shared/layout/platform-layout";
import { EmployeeCard } from "./employee-card";

export function EmployeeGrid({
  employees,
  loadouts = {},
}: {
  employees: EmployeeListItem[];
  loadouts?: Record<string, EmployeeLoadout>;
}) {
  return (
    <ul className={platformEmployeeGridClass}>
      {employees.map((employee) => (
        <li key={employee.id} className="min-w-0">
          <EmployeeCard
            employee={employee}
            loadout={loadouts[employee.id] ?? null}
          />
        </li>
      ))}
    </ul>
  );
}
