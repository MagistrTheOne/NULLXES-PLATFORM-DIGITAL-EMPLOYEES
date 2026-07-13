import { BILLING_PLANS } from "@/features/billing/config/plans";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { useWorkspaceBilling } from "@/features/workspace/components/workspace-billing-provider";
import type { EmployeeListItem } from "../types";

function countCustomEmployees(
  employees: EmployeeListItem[] | number,
): number {
  if (typeof employees === "number") {
    return employees;
  }
  return employees.filter((employee) => employee.source !== "platform").length;
}

export function useEmployeeCreateEligibility(
  employeesOrCustomCount: EmployeeListItem[] | number,
): {
  canCreateEmployee: boolean;
  isAtEmployeeLimit: boolean;
  maxEmployees: number | null;
} {
  const { planId } = useWorkspaceBilling();
  const maxEmployees = BILLING_PLANS[planId].limits.maxEmployees;
  const planAllowsCreate = planAllowsCreateEmployees(planId);
  const customCount = countCustomEmployees(employeesOrCustomCount);
  const isAtEmployeeLimit =
    maxEmployees != null && customCount >= maxEmployees;

  return {
    canCreateEmployee: planAllowsCreate && !isAtEmployeeLimit,
    isAtEmployeeLimit: !planAllowsCreate || isAtEmployeeLimit,
    maxEmployees: planAllowsCreate ? maxEmployees : 0,
  };
}
