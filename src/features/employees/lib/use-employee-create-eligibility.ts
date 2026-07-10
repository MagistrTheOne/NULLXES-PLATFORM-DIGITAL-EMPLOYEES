import { BILLING_PLANS } from "@/features/billing/config/plans";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { useWorkspaceBilling } from "@/features/workspace/components/workspace-billing-provider";

export function useEmployeeCreateEligibility(employeeCount: number): {
  canCreateEmployee: boolean;
  isAtEmployeeLimit: boolean;
  maxEmployees: number | null;
} {
  const { planId } = useWorkspaceBilling();
  const maxEmployees = BILLING_PLANS[planId].limits.maxEmployees;
  const planAllowsCreate = planAllowsCreateEmployees(planId);
  const isAtEmployeeLimit =
    maxEmployees != null && employeeCount >= maxEmployees;

  return {
    canCreateEmployee: planAllowsCreate && !isAtEmployeeLimit,
    isAtEmployeeLimit: !planAllowsCreate || isAtEmployeeLimit,
    maxEmployees: planAllowsCreate ? maxEmployees : 0,
  };
}
