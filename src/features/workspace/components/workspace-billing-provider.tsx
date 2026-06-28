"use client";

import { createContext, useContext } from "react";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { planAllowsCustomAvatars } from "@/features/billing/lib/plan-capabilities";
import type { UserBillingSnapshot } from "@/features/billing/services/get-user-billing-snapshot";

type WorkspaceBillingContextValue = {
  planId: BillingPlanId;
  planName: string;
  priceLabel: string;
  allowCustomAvatars: boolean;
  checkoutUrl: string | null;
};

const WorkspaceBillingContext = createContext<WorkspaceBillingContextValue | null>(
  null,
);

export function WorkspaceBillingProvider({
  billing,
  children,
}: {
  billing: UserBillingSnapshot;
  children: React.ReactNode;
}) {
  const value: WorkspaceBillingContextValue = {
    planId: billing.planId,
    planName: billing.planName,
    priceLabel: billing.priceLabel,
    allowCustomAvatars: planAllowsCustomAvatars(billing.planId),
    checkoutUrl: billing.checkoutUrl,
  };

  return (
    <WorkspaceBillingContext.Provider value={value}>
      {children}
    </WorkspaceBillingContext.Provider>
  );
}

export function useWorkspaceBilling(): WorkspaceBillingContextValue {
  const context = useContext(WorkspaceBillingContext);
  if (!context) {
    throw new Error("useWorkspaceBilling must be used within WorkspaceBillingProvider");
  }
  return context;
}
